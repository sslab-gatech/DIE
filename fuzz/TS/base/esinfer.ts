import { inspect } from "util";

import * as t from "@babel/types";
import generate from "@babel/generator";
import traverse, { Node, NodePath, Scope } from "@babel/traverse";

import * as UTILS from "./utils";
import { TSNode } from "./esparse";
import { st, isEqual, BuiltinNonConstructor, PrototypeType, ImmutableType } from "./estypes";
import { Types, FunctionType, ConstructorType, ArgsType, ArgType, BuiltinConstructor, TypedArray } from "./estypes";
import { BinaryExpressionDsps, BuiltinConstructorNames, TypedArrayNames, Dsp, FunctionDsp, PropertyDsp, BuiltinNonConstructorNames, LogicalExpressionDsps, UnaryExpressionDsps, UpdateExpressionDsps } from "./esspecs";

const printf = UTILS.printf,
	assert = UTILS.assert,
	Random = UTILS.Random,
	dbglog = UTILS.dbglog;

export class Inferer {
	root: t.File;
	change: boolean;
	funcMap: Map<string, Types>;
	constructor(root: TSNode) {
		this.root = <t.File><unknown>root;
		this.change = false;
		this.funcMap = new Map<string, Types>();
	}

	inferLiteral(node: t.Literal): Types {
		if (t.isNumericLiteral(node)) {
			return st.numberType;
		} else if (t.isBooleanLiteral(node)) {
			return st.booleanType;
		} else if (t.isRegExpLiteral(node)) {
			return st.regexpType;
		} else if (t.isStringLiteral(node)) {
			return st.stringType;
		} else if (t.isNullLiteral(node)) {
			return st.nullType;
		}
	}

	inferArray(node: t.ArrayExpression): Types {
		let elements = node.elements;
		let tnode: TSNode = <TSNode><unknown>node;
		let types: Set<Types> = new Set();
		let type: Types = tnode.itype;

		for (let v of elements) {
			let node: TSNode = <TSNode>v;
			if (node && node.itype) {
				types.add(node.itype);
			}
		}

		type = st.arrayType;
		if (types.size == 0) {
			type = st.numberArrayType;
		} else if (types.size == 1) {
			let elemType: Types = types.values().next().value;
			if (elemType === st.numberType) {
				type = st.numberArrayType;
			} else if (elemType === st.stringType) {
				type = st.stringArrayType;
			} else {
				type = st.arrayType;
			}
		}
		return type;
	}

	inferBinaryExpression(node: t.BinaryExpression): Types {
		return BinaryExpressionDsps[node.operator].infer(node);
	}

	inferLogicalExpression(node: t.LogicalExpression): Types {
		return LogicalExpressionDsps[node.operator].infer();
	}
	
	inferUnaryExpression(node: t.UnaryExpression): Types {
		return UnaryExpressionDsps[node.operator].infer();
	}

	inferUpdateExpression(node: t.UpdateExpression): Types {
		return UpdateExpressionDsps[node.operator].infer();
	}

	// Array.prototype => PrototypeType
	// prototype => ImmutableType
	inferIdentifier(path: NodePath<t.Identifier>): Types {
		let node: t.Identifier = path.node;
		let tnode: TSNode = <TSNode><t.BaseNode>node;
		let type: Types = tnode.itype;

		if (tnode.info.isFuncArgv) {
//			if (!tnode.itype) {
//				type = st.anyType;
//			}
		}
		if (tnode.info.isProperty) {
			type = st.immutableType;
		}
		if (tnode.info.construct) {
			type = tnode.info.construct;
			assert(type !== undefined);
		}
		if (this.funcMap.has(node.name))
			type = this.funcMap.get(node.name);
		return type;
	}

	// TODO
	inferArrayPattern() {

	}

	findRetType(node: Node, scope: Scope, parentPath: NodePath): Types {
		let type: Types = st.undefinedType;
		traverse(node, {
			ReturnStatement(path) {
				let argument: TSNode = <TSNode><t.Expression>path.node.argument;
				if (argument)
					type = argument.itype;
				path.stop();
			}
		}, scope)
		return type;
	}

	enterFunction(node: t.FunctionExpression | t.ArrowFunctionExpression) {
		for (let param of node.params) {
			let argNode: TSNode = <TSNode><unknown>param;
			argNode.info.isFuncArgv = true;
		}
	}

	inferFunction(node: t.Function, scope: Scope, parentPath: NodePath): Types {
		let tnode: TSNode = <TSNode><t.BaseNode>node;
		let type: Types = tnode.itype;
		let args: ArgType[] = [];
		for (let param of node.params) {
			let tNode: TSNode = <TSNode><unknown>param;
			if (!tNode.itype) {
				tNode.itype = st.anyType;
			}
			args.push(new ArgType(tNode.itype));
		}
		type = new FunctionType(new ArgsType(args), this.findRetType(node, scope, parentPath));
		if (node["id"])
			this.funcMap.set(node["id"].name, type);
		return type;
	}

	enterMemberExpression(node: t.MemberExpression) {
		let object: TSNode = <TSNode><t.BaseNode>node.object;
		let property: TSNode = <TSNode><t.BaseNode>node.property;
		if (t.isIdentifier(node.object)) {
			if (BuiltinConstructorNames.includes(<BuiltinConstructor>node.object.name)) {
				object.info.construct = st.constructorTypes[node.object.name];
			} else if (BuiltinNonConstructorNames.includes(<BuiltinNonConstructor>node.object.name)) {
				object.info.construct = st.getType(node.object.name);
			}
			else if (TypedArrayNames.includes(<TypedArray>node.object.name)) {
				object.info.construct = st.constructorTypes.TypedArray;
			}
		}
		if (t.isIdentifier(node.property)) {
			//if (object.itype) {
				property.info.isProperty = true;
			//}
		}

	}

	inferMemberExpression(node: t.MemberExpression) {
		let tnode: TSNode = <TSNode><unknown>node;
		let type: Types = tnode.itype;
		let object: TSNode = <TSNode>node.object;
		if (!object.itype) {
			return type;
		}

		let dsps = object.itype.dsps();
		let dsp: Dsp = undefined;
		let fdsp: FunctionDsp = undefined;
		if (t.isIdentifier(node.property)) {
			// TODO temporarily disable getPrototypeOf
			if (node.property.name == "getPrototypeOf") {
				return st.immutableType;
			}

			if (object.itype instanceof ConstructorType) {
				if (dsps.constp) {
					dsp = dsps.constp[node.property.name];
					if (dsp instanceof PropertyDsp) {
						type = dsp.infer();
					}
				}
				if (dsps.constf) {
					fdsp = dsps.constf[node.property.name];
					if (fdsp instanceof FunctionDsp) {
						type = new FunctionType(fdsp.args, fdsp.infer());
					}
				}
			} else {
				if (dsps.property) {
					dsp = dsps.property[node.property.name];
					if (dsp instanceof PropertyDsp) {
						type = dsp.infer();
					}
				}
				if (dsps.function) {
					fdsp = dsps.function[node.property.name];
					if (fdsp instanceof FunctionDsp) {
						type = new FunctionType(fdsp.args, fdsp.infer());
					}
				}
			}
			if (object.itype) {
				if (this.isPrototype(node.property)) {
					type = st.prototypeTypes[object.itype.type]
					if (object.itype instanceof ConstructorType)
						type = st.prototypeTypes[object.itype.name];
				}
			}
		}

		// UTILS.dbgassert(!!type, inspect(dsps, false, 2, true) + node.property.name);
		return type;
	}
	
	isPrototype(node : t.Identifier) : boolean {
		if (node.name == "prototype") 
			return true;
		return false;
	}

	private enterCallback = (path) => {
		if (path.isFunction()) {
			this.enterFunction(path.node);
		}
		if (path.isMemberExpression()) {
			this.enterMemberExpression(path.node);
		}
	}

	private exitCallback = (path: NodePath<Node>) => {
		let tnode: TSNode = <TSNode>path.node;
		let type: Types = tnode.itype;

		if (path.isLiteral()) {
			type = this.inferLiteral(path.node);

		} else if (path.isBinaryExpression()) {
			type = this.inferBinaryExpression(path.node);

		} else if (path.isLogicalExpression()) {
			type = this.inferLogicalExpression(path.node);
		
		} else if (path.isUnaryExpression()) {
			type = this.inferUnaryExpression(path.node);

		} else if (path.isUpdateExpression()) {
			type = this.inferUpdateExpression(path.node);

		} else if (path.isArrayExpression()) {
			type = this.inferArray(path.node);

		} else if (path.isFunction()) {
			type = this.inferFunction(path.node, path.scope, path.parentPath);

		} else if (path.isNewExpression()) {

			let callee : TSNode = <TSNode>path.node.callee;
			if(callee.itype instanceof FunctionType) {
				type = callee.itype.retType;
			}

		} else if (path.isIdentifier()) {
			type = this.inferIdentifier(path);

		} else if (path.isUpdateExpression()) {
			type = (<TSNode>path.node.argument).itype;	

		} else if (path.isCallExpression()) {
			type = (<TSNode>path.node.callee).itype;
			if (type instanceof FunctionType) {
				type = type.retType;	
			}
		}
		// for prototype
		else if (path.isMemberExpression()) {
			type = this.inferMemberExpression(path.node);
		}
		// Assignment-like operation
		else if (path.isAssignmentExpression() || path.isAssignmentPattern()) {
            type = (<TSNode>path.node.right).itype; 
		}	
		// variable declaration
		if(!isEqual(type, tnode.itype)) {
			tnode.itype = type;
			this.change = true;
		}
	}

	// function should be cared specially
	infer() : TSNode {
		let round = 0;
		for (; round < 50; round++) {
			this.change = false;
			traverse(this.root, { enter: this.enterCallback, exit: this.exitCallback });
			if (this.change == false) break;
		}
		dbglog("Round in infer : " + round);
		return <TSNode><unknown>this.root;
	}
}


