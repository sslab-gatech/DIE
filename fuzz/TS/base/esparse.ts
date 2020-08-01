import * as t from "@babel/types";
import { parse } from "@babel/parser";
import { ParserOptions } from "@babel/parser";
import traverse, { Node, NodePath } from "@babel/traverse";

import { Preference } from "./espreference";
import { dbgassert, dbglog, assert, makeLocTuple, printf } from "./utils";
import { json2type, st, BaseType, BuiltinConstructor, TypedArray, Types, ConstructorType, BuiltinNonConstructor, SerializedTypes, SerializedType } from "./estypes";
import { BuiltinConstructorNames, TypedArrayNames, NewExpressionDsps, NewExpressionDsp, BuiltinNonConstructorNames } from "./esspecs";
import generate from "@babel/generator";

 export class TSNodeInfo {
    isInBlock?: boolean; 
    isInLoop?: boolean;
    isInIf?: boolean;
    isInFunc?: boolean;
    isFuncArgv?: boolean;
    isProperty?: boolean;
    depth?: number;
    maxDepth?: number;
    construct?: Types;

    constructor(other: TSNodeInfo = undefined) {
        if (other) {
            this.isInBlock = other.isInBlock;
            this.isInLoop = other.isInLoop;
            this.isInIf = other.isInIf;
            this.isInFunc = other.isInFunc;
            this.isFuncArgv = other.isFuncArgv;
            this.isProperty = other.isProperty;
        }
    }
}

export interface TSNode extends t.BaseNode {
    info: TSNodeInfo;
    preference? : Preference;
    itype: Types;
}

export class TypedAST {
    root: TSNode;
    types: object;
    numbers: Array<number>;
    strings: Array<string>;
    maxVarCnt: number;

    constructor(code: string, types: object, options: ParserOptions) {
        this.root = <TSNode><t.BaseNode>parse(code, options);
        this.types = types;
        this.numbers = [];
        this.strings = [];
    }

    // TODO: does "WITH" or "TRY" create new scope too?
    static setScope(node: t.BaseNode, property: TSNodeInfo) {
        if (t.isFunction(node)) {
            property.isInFunc = true;
        } else if (t.isBlockStatement(node)){
            property.isInBlock = true;
        } else if (t.isIfStatement(node)) {
            property.isInIf = true;
        } else if (t.isLoop(node)) {
            property.isInLoop = true;
        }
    }

    Parse() : TSNode {
        // The true start 
        this.root.info = {isInLoop : false, isInIf : false, isInBlock : false, isInFunc : false, depth : 0};
        let tast: TypedAST = this; 

        try {

            let stack = [];
            let curInfo = this.root.info;
            let curDepth = 0;

            let numberliteral = (path: NodePath<t.NumericLiteral>) => { 
                this.numbers.push(path.node.value);
            }

            let stringliteral = (path: NodePath<t.StringLiteral>) => {
                this.strings.push(path.node.value);
            }

            let tIter: IterableIterator<SerializedType> = (<SerializedTypes>tast.types).values();
            let lastEnterNode: TSNode = null;
            let maxVarCnt: number = -1;

            traverse(<Node>this.root, {

                enter(path: NodePath<Node>) {
                    let node: TSNode = <TSNode>path.node;
                    node.info = new TSNodeInfo(curInfo);
                    TypedAST.setScope(node, node.info);
                    stack.push(curInfo);
                    curInfo = node.info;
                    node.info.depth = curDepth;
                    curDepth++;

                    let type: SerializedType = tIter.next().value;
                    if (type)
                        node.itype = BaseType.deserialize(type);
                    node.preference = null;

                    // Get the max count of our custom variables
                    if (t.isVariableDeclarator(node)) {
                        if (t.isIdentifier(node.id)) {
                            let id: string = node.id.name;
                            if (id.indexOf("__es_v") == 0) {
                                let varCnt: number = parseInt(id.substring("__es_v".length));
                                if (varCnt > maxVarCnt)
                                    maxVarCnt = varCnt;
                            }
                        }
                    }

                    lastEnterNode = node;
                },

                exit(path: NodePath<Node>) {
                    curInfo = stack.pop();
                    curDepth--;
                    
                    let node: TSNode = <TSNode>path.node;
                    if (node === lastEnterNode) { // leaf
                        node.info.maxDepth = node.info.depth;
                    }
                    
                    let parentNode: TSNode = <TSNode>path.parent;
                    if (parentNode) {
                        if (!parentNode.info.maxDepth) {
                            parentNode.info.maxDepth = node.info.maxDepth;
                        } else {
                            parentNode.info.maxDepth = Math.max(parentNode.info.maxDepth, node.info.maxDepth + 1);
                        }
                    }
                    // printf(node.info.depth + "/" + node.info.maxDepth);
                },

                NumericLiteral: numberliteral,
                StringLiteral: stringliteral,

            });
            this.maxVarCnt = maxVarCnt;
            assert(tIter.next().done, "There are types not consumed!?");
        } catch (e) {
            dbglog(e);
        }
        return this.root;
    }

    // This is used to parse a testcase for type inferring.
    ParseRaw(): TSNode {

        this.root.info = {};
        let tast: TypedAST = this; 

        try {

            traverse(<Node>this.root, {

                enter(path: NodePath<Node>) {
                    let node: TSNode = <TSNode> path.node;
                    node.info = new TSNodeInfo();
                    let loc: string = makeLocTuple(<Node>node);
                    if (tast.types && tast.types[loc])
                        node.itype = json2type(tast.types[loc]);
                },

                exit(path: NodePath<Node>) {
                },

                Identifier(path: NodePath<t.Identifier>) {
                    let node: TSNode = <TSNode><unknown> path.node;
                    let type: Types;
                    if (TypedArrayNames.includes(<TypedArray>path.node.name)) {
                        let dsp: NewExpressionDsp = NewExpressionDsps[path.node.name] 
                        type = new ConstructorType(path.node.name, dsp.infer());
                        assert(dsp.type !== undefined, path.node.name);
                    }
                    else if (BuiltinNonConstructorNames.includes(<BuiltinNonConstructor>path.node.name)) {
                        type = st.getType(path.node.name);
                    }
                    else if (BuiltinConstructorNames.includes(<BuiltinConstructor>path.node.name)) {
                        type = st.constructorTypes[path.node.name]
                        dbgassert(type !== undefined, path.node.name);
                    }
                    if (type)
                        node.itype = type; 
                },
              
                VariableDeclarator(path: NodePath<Node>) {
                    let node: TSNode = <TSNode> path.node;
                    node.itype = st.voidType; 
                },
                VariableDeclaration(path: NodePath<Node>) {
                    let node: TSNode = <TSNode> path.node;
                    node.itype = st.voidType; 
                },
                FunctionDeclaration(path: NodePath<Node>) {
                    let node: TSNode = <TSNode> path.node;
                    node.itype = st.voidType; 
                },
                BlockStatement(path: NodePath<Node>) {
                    let node: TSNode = <TSNode> path.node;
                    node.itype = st.voidType; 
                },
                ForStatement(path: NodePath<Node>) {
                    let node: TSNode = <TSNode> path.node;
                    node.itype = st.voidType; 
                },
                IfStatement(path: NodePath<Node>) {
                    let node: TSNode = <TSNode> path.node;
                    node.itype = st.voidType; 
                },
                ReturnStatement(path: NodePath<Node>) {
                    let node: TSNode = <TSNode> path.node;
                    node.itype = st.voidType; 
                },
                ExpressionStatement(path: NodePath<Node>) {
                    let node: TSNode = <TSNode> path.node;
                    node.itype = st.voidType; 
                }
               
            });
        } catch (e) {
            printf(e);
        }
        return this.root;
    };

    dumpTypes(): SerializedTypes {
        let types: SerializedTypes = [];
        
        traverse(<Node>this.root, {
            enter(path: NodePath<Node>) {
                let node: TSNode = <TSNode>path.node;
                if (node.itype) {
                    types.push(node.itype.serialize());
                } else {
                    types.push(undefined);    
                }
            }
        });

        return types;
    }
}
