import * as bt from "@babel/types";
import { TSNode } from "../esparse";
import { st, NumberType, BooleanType, RegExpType, StringType, NullType, Types } from "../estypes";

// **************************************************************************************
//
// TSNode Builders
//
// **************************************************************************************
export class TSNodeBuilder {
    
    constructor() {}

    public buildNumericLiteral(value: number): TSNode {
        let node: TSNode = <TSNode><bt.BaseNode>bt.numericLiteral(value);
        node.itype = new NumberType();
        return node;
    }

    public buildBooleanLiteral(value: boolean): TSNode {
        let node: TSNode = <TSNode><bt.BaseNode>bt.booleanLiteral(value);
        node.itype = new BooleanType();
        return node;
    }

    public buildRegExpLiteral(pattern: string, flag: string = ""): TSNode {
        let node: TSNode = <TSNode><bt.BaseNode>bt.regExpLiteral(pattern, flag);
        node.itype = new RegExpType();
        return node;
    }

    public buildStringLiteral(value: string) {
        let node: TSNode = <TSNode><bt.BaseNode>bt.stringLiteral(value);
        node.itype = new StringType();
        return node;
    }

    public buildNullLiteral() {
        let node: TSNode = <TSNode><bt.BaseNode>bt.nullLiteral();
        node.itype = new NullType();
        return node;
    }

    public buildBinaryExpression(operator: bt.BinaryExpression['operator'], left: TSNode, right: TSNode, type: Types) {
        let node: TSNode = <TSNode><bt.BaseNode>bt.binaryExpression(operator, <bt.Expression>left, <bt.Expression>right);
        node.itype = type;
        return node;
    }

    public buildLogicalExpression(operator: bt.LogicalExpression['operator'], left: TSNode, right: TSNode, type: Types) {
        let node: TSNode = <TSNode><bt.BaseNode>bt.logicalExpression(operator, <bt.Expression>left, <bt.Expression>right);
        node.itype = type;
        return node;
    }

    public buildUnaryExpression(operator: bt.UnaryExpression['operator'], argument: TSNode, prefix: boolean, type: Types) {
        let node: TSNode = <TSNode><bt.BaseNode>bt.unaryExpression(operator, <bt.Expression>argument, prefix);
        node.itype = type;
        return node;
    }

    public buildUpdateExpression(operator: bt.UpdateExpression['operator'], argument: TSNode, prefix: boolean, type: Types) {
        let node: TSNode = <TSNode><bt.BaseNode>bt.updateExpression(operator, <bt.Expression>argument, prefix);
        node.itype = type;
        return node;
    }

    public buildNewExpression(callee: TSNode, _arguments: Array<TSNode>, type: Types) {
        let node: TSNode = <TSNode><bt.BaseNode>bt.newExpression(<bt.Expression>callee, <Array<bt.Expression>>_arguments);
        node.itype = type;
        return node;
    }

    public buildIdentifier(name: string, type: Types) {
        let node: TSNode = <TSNode><bt.BaseNode>bt.identifier(name);
        node.itype = type;
        return node;
    }

    public buildNumberLiteralSequence(values: Array<number>): Array<TSNode> {
        let ret: TSNode[] = new Array(values.length);
        for (let i = 0; i < values.length; i++) {
            ret[i] = this.buildNumericLiteral(values[i]);
        }
        return ret;
    }

    public buildMemberExpression(object: TSNode, property: TSNode, computed: boolean, type: Types) {
        let node: TSNode = <TSNode><bt.BaseNode>bt.memberExpression(<bt.Expression>object, property, computed);
        node.itype = type;
        return node;
    }

    public buildCallExpression(callee: TSNode, _arguments: Array<TSNode>, type: Types): TSNode {
        let node: TSNode = <TSNode><bt.BaseNode>bt.callExpression(<bt.Expression>callee, <Array<bt.Expression>>_arguments);
        node.itype = type;
        return node;
    }

    public buildArrayExpression(elements: Array<TSNode>, type: Types): TSNode {
        let node: TSNode = <TSNode><bt.BaseNode>bt.arrayExpression(<Array<bt.Expression>>elements);
        node.itype = type;
        return node;
    }

    public buildObjectProperty(key: TSNode, value: TSNode, computed: boolean) {
        let node: TSNode = <TSNode><bt.BaseNode>bt.objectProperty(<bt.Expression>key, <bt.Expression>value, computed);
        node.itype = st.immutableType;
        return node;
    }

    public buildObjectExpression(properties: Array<TSNode>, type: Types) {
        let node: TSNode = <TSNode><bt.BaseNode>bt.objectExpression(<Array<bt.ObjectProperty>><Array<bt.BaseNode>>properties);
        node.itype = type;
        return node;
    }

    public buildAssignExpression(op: string, left: TSNode, right: TSNode) {
        let node: TSNode = <TSNode><bt.BaseNode>bt.assignmentExpression(op, <bt.LVal><bt.Expression>left, <bt.Expression>right);
        node.itype = st.voidType;
        return node;
    }

    public buildFunctionExpression(id : TSNode, params : Array<TSNode>, body : TSNode, generator : boolean, async : boolean, type : Types) {
        let node : TSNode = <TSNode><bt.BaseNode>bt.functionExpression(
            <bt.Identifier><bt.BaseNode>id,
            <Array<bt.Identifier>><Array<bt.BaseNode>>params,
            <bt.BlockStatement><bt.BaseNode>body,
            generator,
            async
        );
        node.itype = type;
        return node;
    }

    public buildBlockStatement(body : Array<TSNode>) {
        let node: TSNode = <TSNode><bt.BaseNode>bt.blockStatement(<Array<bt.Statement>>body);
        node.itype = st.voidType;
        return node;
    }

    public buildReturnStatement(argument : TSNode) {
        let node: TSNode = <TSNode><bt.BaseNode>bt.returnStatement(<bt.Expression>argument);
        node.itype = st.voidType;
        return node;
    }

    public buildExpressionStatement(exp : TSNode) {
        let node: TSNode = <TSNode><bt.BaseNode>bt.expressionStatement(<bt.Expression>exp);
        node.itype = st.voidType;
        return node;
    }

    public buildVariableDeclarator(id: TSNode, init: TSNode) {
        let node: TSNode = <TSNode><bt.BaseNode>bt.variableDeclarator(<bt.LVal><bt.BaseNode>id, <bt.Expression>init);
        node.itype = st.voidType;
        return node;
    }

    public buildVariableDeclaration(kind: string, declarator: TSNode) {
        let node: TSNode = <TSNode><bt.BaseNode>bt.variableDeclaration(<any>kind, [<bt.VariableDeclarator><bt.BaseNode>declarator]);
        node.itype = st.voidType;
        return node; 
    }
}
