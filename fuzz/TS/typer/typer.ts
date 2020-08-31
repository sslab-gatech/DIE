import * as FS from "fs";
import * as VM from "vm";
import * as SP from "child_process";

import {parse} from "@babel/parser";
import traverse, { NodePath, Node } from "@babel/traverse";
import * as t from "@babel/types";

// <line, isBefore?>
class InstLocation {
	line : number;
	isBefore : boolean;

	constructor(line, isBefore) {
		this.line = line;
		this.isBefore = isBefore;
	}
};

var debug = false;

var fpath = process.argv[2];
var code = FS.readFileSync(fpath).toString();

var lines = code.split("\n");
var postInstNodes : Map<Node, InstLocation> = new Map<Node, InstLocation>();
var skips : Set<Node> = new Set<Node>();
var bInst = {}, aInst = {};

var root = parse(code, {
  plugins: [
	"classProperties"
  ]
});

var cnt = 0;
function getInsertID() {
    return "Inst" + (cnt++);
}

var header = ` 
function _TypeOfArray(a) {
	let number = true;	
	let string = true;
	for (let i = 0; i < a.length; i++) {
		if (number && (typeof a[i]) != "number") {
			number = false;	
		}
		if (string && (typeof a[i]) != "string") {
			string = false;	
		}
		if (!number && !string)
			break;
	}
	if (number)
		return "number";
	else if (string)
		return "string";
	else
		return "any";
}

function _TypeIsEqual(t1, t2) {
	return JSON.stringify(t1) === JSON.stringify(t2);
}

function _TypeOf(a, step) {
	var t;
	var type = Object.prototype.toString.call(a).slice(8, -1).toLowerCase();	
	if (type == "array") {
		t = {type : type, extra: {elemType: _TypeOfArray(a)}};
	} else if (type == "object") {
		let shape = [];
        if (step === undefined || step > 0) {
            let keys = Object.keys(a);
            let length = Math.min(100, keys.length);
		    for (let i = 0; i < length; i++) {
			    shape.push([keys[i], _TypeOf(a[keys[i]], step === undefined ? 1 : step - 1)]);	
		    }
        }
		t = {type : type, extra: {shape: shape}};
	} else {
		t = {type : type};
	} 
	return t;
}

function _RecordType(loc, a) {
	var t = _TypeOf(a);
    print("~~~TypeInfo:" + loc + ":" + JSON.stringify(t));
}
`;

function rewrite() {
	var code_ = "";
    for (let i = 0; i < cnt; i++) {
        code_ += "var Inst" + i + " = 0;\n"; 
    }
    code_ += header;
	for (let i = 0; i < lines.length; i++) {
		if ((i + 1) in bInst)
			code_ += bInst[i + 1] + "\n";
		code_ += lines[i] + "\n";
		if ((i + 1) in aInst) {
			code_ += aInst[i + 1] + "\n";
		}
	}
	return code_;
}

function isInterested(path) {
	return ["Identifier",
			"MemberExpression",			
			// "ObjectExpression",
			// "ObjectMethod",
			// "BinaryExpression",
			// "LogicalExpression",
			// "UnaryExpression",
			// "UpdateExpression",
			// "ArrayExpression",
			// "NewExpression",
			// "SpreadElement",
			].includes(path.node.type);
			// || path.node.type.endsWith("Literal");
}

function findNearestParent(path, isBefore) : InstLocation {
	let parent : NodePath = path.parentPath;
	let nearest : NodePath = null, postInstNode : Node = null;

	if (!postInstNodes.has(path.node)) {
		while (parent) {
			if (!nearest && ((t.isStatement(parent)) || (t.isDeclaration(parent)))) {
				nearest = parent;
			}
			if (postInstNodes.has(parent.node)) {
				postInstNode = parent.node;
				break;
			}
			parent = parent.parentPath;
		}
	} else {
		postInstNode = path.node;
	}

	if (postInstNode) {
		return postInstNodes.get(postInstNode);
	} else if (nearest) {
		return new InstLocation(isBefore ? nearest.node.loc.start.line : nearest.node.loc.end.line, isBefore);
	} else {
		return new InstLocation(isBefore ? path.node.loc.start.line : path.node.loc.end.line, isBefore);
	}
}

var keywords = ["break", "case", "catch", "continue", "debugger", "default", "delete", "do", "else", "finally", "for", "function", "if", "in", "instanceof", "new", "return", "switch", "this", "throw", "try", "typeof", "var", "void", "while", "with", "class", "const", "enum", "export", "extends", "import", "super", "implements", "interface", "let", "package", "private", "protected", "public", "static", "yield"];
function instrument(start : number, end : number, line : number, location : InstLocation) {
	let array = location.isBefore ? bInst : aInst;
	let instLine : number = location.line;
	let subCode : string = code.substring(start, end);
    if (keywords.includes(subCode) 
        || subCode == "super.toString") // hacky for ChakraCore
        return;
	if (!(instLine in array))
		array[instLine] = "";
    let id = getInsertID();
    array[instLine] += "try { if (" + id + " <= 1000 && typeof (" + subCode + ") != \"undefined\") {";
    array[instLine] += "_RecordType(\"<" + start.toString() + "," + end.toString() + "," + line.toString() 
                    // + ", " + subCode.substring(0, 4)
                    + ">\"," + "(" + subCode + ")); " + id + "++; } } catch(e) {}";
}

/* We need to specifically handle
(1) FunctionDeclaration
(2) VariableDeclaration
(3) FunctionExpression
(4) AssignmentExpression
(5) ClassDeclaration
(6) ClassMethod (how to handle the method name)
*/

traverse(root, {
	enter(path : NodePath) { 
		let node : Node = path.node;

		if (skips.has(path.node)) {
			path.skip();
		} else {
            
            // handle parameters
			if (t.isFunctionDeclaration(node) || t.isFunctionExpression(node) || t.isClassMethod(node)) {
				let instLoc : InstLocation = new InstLocation(node.body.loc.start.line, false);
                for (let param of node.params) {
                    if (param.type == "Identifier") {
                        postInstNodes.set(param, instLoc);
                    } else if (param.type == "AssignmentPattern") {
                        postInstNodes.set(param.left, instLoc);
                       	postInstNodes.set(param.right, instLoc);
                    } else if (param.type == "RestElement") {
                        postInstNodes.set(param.argument, instLoc);
                    } else {
                        // printf(code.substring(path.node.start, path.node.end));
                        // assert(false, "WTF: " + param.type);
                    }
                }
                if (t.isClassMethod(node)) {
                    skips.add(node.key);
				}
			
			// handle for loops
            } else if (t.isForInStatement(node)) {
				let instLoc : InstLocation = new InstLocation(node.body.loc.start.line, false);
                postInstNodes.set(node.left, instLoc); 
                postInstNodes.set(node.right, instLoc); 
            } else if (t.isForOfStatement(node)) {
				let instLoc : InstLocation = new InstLocation(node.body.loc.start.line, false);
                postInstNodes.set(node.left, instLoc); 
                postInstNodes.set(node.right, instLoc); 
            } else if (t.isForStatement(node)) {
				let instLoc : InstLocation = new InstLocation(node.body.loc.start.line, false);
				postInstNodes.set(node.init, instLoc); 
                postInstNodes.set(node.test, instLoc); 
                postInstNodes.set(node.update, instLoc); 

            // handle the defineds (LVal)
			} else if (t.isVariableDeclaration(node) && !postInstNodes.has(node)) { 
				for (let decl of node.declarations) {
					postInstNodes.set(decl.id, new InstLocation(node.loc.end.line, false));
				}

            } else if (t.isClassDeclaration(node) && !postInstNodes.has(node)) { 
				postInstNodes.set(node.id, new InstLocation(node.loc.end.line, false));

			} else if (t.isAssignmentExpression(node) && !postInstNodes.has(node)) { 
				postInstNodes.set(node.left, findNearestParent(path, false));
			
			// for {a: x}, we do not profile a
            } else if (t.isObjectProperty(node)) {
				skips.add(node.key); 

			} else if (isInterested(path)) {
				if (t.isMemberExpression(node) && t.isIdentifier(node.property))
					skips.add(node.property);
				let instLoc : InstLocation = findNearestParent(path, true);
				instrument(path.node.start, path.node.end, path.node.loc.start.line, instLoc);
			}
		
		}
    }
});

FS.writeFileSync(process.argv[3], rewrite());
