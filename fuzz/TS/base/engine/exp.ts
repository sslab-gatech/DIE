import * as bt from "@babel/types";
import { Node, NodePath } from "@babel/traverse";

import { TSNode } from "../esparse";
import { Preference, objMemPreference } from "../espreference";
import { Random, isNumeric, Pair, assert, printf } from "../utils";
import { typeBuilder, astBuilder, NodeBuilder, builder } from "./esbuild";
import { Types, st, ArrayType, ObjectType, isMatch, FunctionExpressionType, ArgsType } from "../estypes";
import { Weight, BinaryExpressionWeight, LogicalExpressionWeight, UnaryExpressionWeight, UpdateExpressionWeight, NewExpressionWeight, MemberExpressionWeight, ArrayExpressionWeight } from "../esweight";
import { BinaryExpressionDsps, LogicalExpressionDsps, UnaryExpressionDsps, UpdateExpressionDsps, NewExpressionDsps, MemberExpressionDsps, ArrayExpressionDsps, ObjectExpressionDsps, Dsp, BinaryExpressionDsp, LogicalExpressionDsp, UnaryExpressionDsp, UpdateExpressionDsp, NewExpressionDsp } from "../esspecs";
import { MutateChange, MUTATE_OPRND } from "../esmutator";

// **************************************************************************************
//
// Expression Builder
//
// **************************************************************************************
type ExpressionKeys = keyof (typeof BinaryExpressionDsps) | keyof (typeof LogicalExpressionDsps) |
    keyof (typeof UnaryExpressionDsps) | keyof (typeof UpdateExpressionDsps) |
    keyof (typeof NewExpressionDsps) | keyof (typeof MemberExpressionDsps) |
    keyof (typeof ArrayExpressionDsps) | keyof (typeof ObjectExpressionDsps);

abstract class ExpressionBuilder implements NodeBuilder {
    name: string;
    dsps: { [s: string]: Dsp };
    weights: Array<Weight<ExpressionKeys>>;

    constructor(name: string, dsps: { [s: string]: Dsp } = {}, weights: Array<Weight<ExpressionKeys>>) {
        this.name = name;
        this.dsps = dsps;
        this.weights = weights;
    }

    abstract build(x: number, y: string, z: Types, o?: Object): TSNode;
};

export class BinaryExpressionBuilder extends ExpressionBuilder {

    private NumArithOps: Array<string> = ["+", "-", "/", "%", "*", "**", "&", "|", ">>", ">>>", "<<", "^"];
    private CompOps: Array<string> = ["==", "===", "!=", "!==", ">", "<", ">=", "<="];
    private EqualOps: Array<string> = ["==", "===", "!=", "!=="];

    constructor() {
        super("BinaryExpression", BinaryExpressionDsps, BinaryExpressionWeight);
    }
    
    private doBuild(step: number, operator: bt.BinaryExpression["operator"]): TSNode {
        let dsp: BinaryExpressionDsp = <BinaryExpressionDsp>this.dsps[operator];
        assert(dsp !== undefined, "op : " + operator)
        let left: TSNode = <TSNode>typeBuilder.build(step - 1, dsp.left);
        if (!left)
            return null;
        let right: TSNode = <TSNode>typeBuilder.build(step - 1, dsp.right);
        if (!right)
            return null;
        return astBuilder.buildBinaryExpression(operator, left, right, dsp.type);
    }

    private buildPlus(step: number, suggestType: Types): TSNode {
        let type: Types = suggestType;
        let operator: bt.BinaryExpression["operator"] = "+";
        let left: TSNode = <TSNode>typeBuilder.build(step - 1, type);
        if (!left)
            return null;
        let right: TSNode = <TSNode>typeBuilder.build(step - 1, type);
        if (!right)
            return null;
        return astBuilder.buildBinaryExpression(operator, left, right, type);
    }

    private buildEqual(step: number, operator: bt.BinaryExpression["operator"]): TSNode {
        let oprndType = Random.pick(Random.weighted([
            { w: 5, v: st.numberType },
            { w: 1, v: st.stringType },
            { w: 1, v: st.objectType }
        ]));
        let left: TSNode = <TSNode>typeBuilder.build(step - 1, oprndType);
        if (!left)
            return null;
        let right: TSNode = <TSNode>typeBuilder.build(step - 1, oprndType);
        if (!right)
            return null;
        return astBuilder.buildBinaryExpression(operator, left, right, st.booleanType);
    }

    private buildCompare(step: number, operator: bt.BinaryExpression["operator"]): TSNode {
        let oprndType = Random.pick(Random.weighted([
            { w: 5, v: st.numberType },
            { w: 1, v: st.stringType },
        ]));
        let left: TSNode = <TSNode>typeBuilder.build(step - 1, oprndType);
        if (!left)
            return null;
        let right: TSNode = <TSNode>typeBuilder.build(step - 1, oprndType);
        if (!right)
            return null;
        return astBuilder.buildBinaryExpression(operator, left, right, st.booleanType);
    }

    public build(step: number, suggestedOp: string, type: Types = null): TSNode {
        let operator: bt.BinaryExpression["operator"] = suggestedOp ? 
                suggestedOp : Random.pick(Random.weighted(this.weights));

        switch (operator) {
            case "+":
                return this.buildPlus(step, type);
            case "==":
            case "===":
            case "!=":
            case "!==":
                return this.buildEqual(step, operator);
            case ">=":
            case "<=":
            case ">":
            case "<":
                return this.buildCompare(step, operator);
            default:
                return this.doBuild(step, operator);
        }
    }

    private randomNumArithOp(): string {
        return Random.pick(this.NumArithOps);
    }

    private randomCompOp(): string {
        return Random.pick(this.CompOps);
    }

    private randomEqualOp(): string {
        return Random.pick(this.EqualOps);
    }

    public mutateOp(path: NodePath): MutateChange {
        let expNode: bt.BinaryExpression = <bt.BinaryExpression><bt.BaseNode>(path.node);
        let operator: bt.BinaryExpression["operator"] = expNode.operator;
        let left: TSNode = <TSNode>expNode.left;
        let right: TSNode = <TSNode>expNode.right;
        let newOp: string = null;

        if (this.NumArithOps.includes(operator)) {
            if ((operator != "+") ||
                (operator == "+" && left.itype === st.numberType && right.itype === st.numberType)) {
                newOp = this.randomNumArithOp();
            } 
        } else if (this.CompOps.includes(operator)) {
            if (left.itype === st.numberType && right.itype === st.numberType) {
                newOp = this.randomCompOp();
            } else {
                newOp = this.randomEqualOp();
            }
        } 

        if (newOp) {
            return { "type": MUTATE_OPRND, "path": path, "old": <any>operator, "new": newOp };
        } else {
            return null;
        }
    }
};

export class LogicalExpressionBuilder extends ExpressionBuilder {
    constructor() {
        super("LogicalExpression", LogicalExpressionDsps, LogicalExpressionWeight);
    }

    private doBuild(step: number, operator: bt.LogicalExpression['operator']): TSNode {
        let dsp: LogicalExpressionDsp = <LogicalExpressionDsp>this.dsps[operator];
        let left: TSNode = <TSNode>typeBuilder.build(step - 1, dsp.left);
        if (!left)
            return null;
        let right: TSNode = <TSNode>typeBuilder.build(step - 1, dsp.right);
        if (!right)
            return null;
        return astBuilder.buildLogicalExpression(operator, left, right, dsp.type);
    }

    public build(step: number, suggestedOp: string, type: Types): TSNode {
        let operator: bt.LogicalExpression['operator'] = suggestedOp ? suggestedOp : Random.pick(Random.weighted(this.weights));
        return this.doBuild(step, operator);
    }

    public mutateOp(path: NodePath): MutateChange {
        let expNode: bt.LogicalExpression = <bt.LogicalExpression><bt.BaseNode>(path.node);
        let operator: bt.LogicalExpression["operator"] = expNode.operator;
        let newOp: string = null;

        if (operator == "&&") 
            newOp = "||";
        else 
            newOp = "&&";

        return { "type": MUTATE_OPRND, "path": path, "old": <any>operator, "new": newOp };
    }
}

export class UnaryExpressionBuilder extends ExpressionBuilder {
    constructor() {
        super("UnaryExpression", UnaryExpressionDsps, UnaryExpressionWeight);
    }

    private doBuild(step, operator: bt.UnaryExpression['operator'], argument: TSNode): TSNode {
        let dsp: UnaryExpressionDsp = <UnaryExpressionDsp>this.dsps[operator];
        let arg: TSNode = argument ? argument : <TSNode>typeBuilder.build(step - 1, dsp.argument);
        if (!argument)
            return null;
        return astBuilder.buildUnaryExpression(operator, arg, dsp.prefix, dsp.type);
    }

    public build(step: number, suggestedOp: string, type: Types, object: TSNode = null): TSNode {
        return this.doBuild(step, <bt.UnaryExpression['operator']>suggestedOp, object);
    }

    public mutateOp(path: NodePath): MutateChange {
        let expNode: bt.UnaryExpression = <bt.UnaryExpression><bt.BaseNode>(path.node);
        let operator: bt.UnaryExpression["operator"] = expNode.operator;
        let newOp: string = null;

        switch(operator) {
            case "+":
                newOp = "-";
                break;
            case "-":
                newOp = "+";
                break;
            default:
                break;
        }

        if (newOp)
            return { "type": MUTATE_OPRND, "path": path, "old": <any>operator, "new": newOp };
        else
            return null;
    }
};

export class UpdateExpressionBuilder extends ExpressionBuilder {
    constructor() {
        super("UpdateExpression", UpdateExpressionDsps, UpdateExpressionWeight);
    }

    public build(step: number, suggestedOp: string = null, type: Types = null, object: TSNode): TSNode {
        let operator: bt.UpdateExpression['operator'] = suggestedOp ? suggestedOp : Random.pick(Random.weighted(this.weights));
        let dsp: UpdateExpressionDsp = <UpdateExpressionDsp>this.dsps[operator];
        let prefix: boolean = Random.bool();
        let argument: TSNode = null;
        /// I don't want to update numeric literal ! (i.e., 123++) /////////////////
        if(object && bt.isLVal(object)) {
            argument = object;
        } else {
            let preference = new Preference(true, false, true, false, true, false);
            argument = <TSNode>typeBuilder.build(step - 1, dsp.argument, preference);
        }
        ///////////////////////////////////////////////////////////////////////////
        if (!(bt.isIdentifier(<Node>argument) || bt.isMemberExpression(<Node>argument)))
            return null;
        return astBuilder.buildUpdateExpression(operator, argument, prefix, dsp.type);
    }

    public mutateOp(path: NodePath): MutateChange {
        let expNode: bt.UpdateExpression = <bt.UpdateExpression><bt.BaseNode>(path.node);
        let operator: bt.UpdateExpression["operator"] = expNode.operator;
        let newOp: string = null;

        if (operator == "++")
            newOp = "--";
        else
            newOp = "++";

        return { "type": MUTATE_OPRND, "path": path, "old": <any>operator, "new": newOp };
    }
};

export class NewExpressionBuilder extends ExpressionBuilder {
    constructor() {
        super("NewExpression", NewExpressionDsps, NewExpressionWeight);
    }

    /* Example:
    Node {
     type: 'Identifier',
     start: 4,
     end: 9,
     loc:
      SourceLocation { start: [Position], end: [Position], identifierName: 'Array' },
     name: 'Array' },
    */
    private buildCallee(operator: string): TSNode {
        let node: TSNode = astBuilder.buildIdentifier(operator, st.constructorTypes[operator]);
        return node;
    }

    private buildArrayLength(): number {
        if (Random.bool()) {
            return Random.number(16);
        } else {
            return Random.pick([0x10, 0x20, 0x40, 0x80, 0x100, 0x200, 0x400, 0x800, 0x1000]);
        }
    }

    private buildArrayBufferLength(): number {
        // XXX: 0x7fffffff?
        return Random.pick([0x10, 0x20, 0x40, 0x80,
            0x100, 0x200, 0x400, 0x800,
            0x1000, 0x10000, 0x1000000, 0x2000000]);
    }


    // todo: use elements to new an array
    private buildArray(): TSNode {
        let length: number = this.buildArrayLength();
        let args: Array<TSNode> = [];
        if (length > 0) {
            args.push(astBuilder.buildNumericLiteral(length));
        }
        return astBuilder.buildNewExpression(this.buildCallee("Array"), args, st.arrayType);
    }

    private buildArrayBuffer(): TSNode {
        let length: number = this.buildArrayBufferLength();
        let args: Array<TSNode> = [astBuilder.buildNumericLiteral(length)];
        return astBuilder.buildNewExpression(this.buildCallee("ArrayBuffer"), args, st.arraybufferType);
    }

    private buildSharedArrayBuffer(): TSNode {
        let length: number = this.buildArrayBufferLength();
        let args: Array<TSNode> = [astBuilder.buildNumericLiteral(length)];
        return astBuilder.buildNewExpression(this.buildCallee("SharedArrayBuffer"), args, st.sharedarraybufferType);
    }

    private buildTypedArray(step: number, operator: string): TSNode {
        let ret = this.doBuild(step, operator);
        if (!ret) {
            let callee: TSNode = this.buildCallee(operator);
            let length: number = this.buildArrayLength();
            let args: Array<TSNode> = [astBuilder.buildNumericLiteral(length)];
            let type: Types = st[operator.toLowerCase() + "Type"];
            return astBuilder.buildNewExpression(callee, args, type);
        }
        return ret;
    }

    private buildDate(): TSNode {
        let args: Array<TSNode> = [];
        switch (Random.number(3)) {
            case 1:
                break;
            case 2:
                args.push(astBuilder.buildStringLiteral("December 17, 1995 03:24:00"));
                break;
            case 3:
                args = astBuilder.buildNumberLiteralSequence([1995, 11, 17, 3, 24, 0]);
                break;
        }
        return astBuilder.buildNewExpression(this.buildCallee("Date"), args, st.dateType);
    }

    private doBuild(step: number, operator: string): TSNode {
        let dsp: NewExpressionDsp = <NewExpressionDsp>this.dsps[operator];
        let args: Array<TSNode> = <Array<TSNode>>typeBuilder.build(step - 1, dsp.arguments);
        if (!args)
            return null;
        return astBuilder.buildNewExpression(this.buildCallee(operator), args, dsp.type);
    }

    public build(step: number, suggestedOp: string, type: Types): TSNode {
        let operator: string = suggestedOp ? suggestedOp : Random.pick(Random.weighted(this.weights));
        switch (operator) {
            case "Array":
                return this.buildArray();
            case "Int8Array":
            case "Uint8Array":
            case "Uint8ClampedArray":
            case "Int16Array":
            case "Uint16Array":
            case "Int32Array":
            case "Uint32Array":
            case "Float32Array":
            case "Float64Array":
                return this.buildTypedArray(step, operator);
            case "Date":
                return this.buildDate();
            default:
                return this.doBuild(step, operator);
        }
    }
};


// **************************************************************************************
//
// Member Expression Builder (Array Index / Property Reference)
// Note: This builder may return null.
//
// **************************************************************************************
export class MemberExpressionBuilder extends ExpressionBuilder {
    constructor() {
        super("MemberExpression", MemberExpressionDsps, MemberExpressionWeight);
    }

    private buildKeyValue(o: TSNode, s: string, t: Types): TSNode {
        let property: TSNode;
        let computed: boolean;
        if (isNumeric(s)) {
            computed = true;
            property = astBuilder.buildNumericLiteral(parseInt(s));
        } else {
            computed = false;
            property = astBuilder.buildIdentifier(s, st.immutableType);
        }
        return astBuilder.buildMemberExpression(o, property, computed, t);
    }

    private buildTypedArrayIndex(step: number, type: Types, typedArray: TSNode = null): TSNode {
        if (type && type !== st.numberType)
            return null;

        let ta: TSNode = typedArray ? typedArray : <TSNode>typeBuilder.build(step - 1, st.typedarrayType);
        if (!ta)
            return null;

        let index: TSNode = <TSNode>typeBuilder.build(step - 1, st.numberType);
        if (!index)
            return null;

        return astBuilder.buildMemberExpression(ta, index, true, st.numberType);
    }

    private buildArrayIndex(step: number, type: Types, array: TSNode = null): TSNode {
        let a: TSNode = array ? array : <TSNode>typeBuilder.build(step - 1, st.getArrayType(type));
        if (!a)
            return null;

        let index: TSNode = <TSNode>typeBuilder.build(step - 1, st.numberType);
        if (!index)
            return null;

        let itype: Types = (<ArrayType>(a.itype)).elemType;
        return astBuilder.buildMemberExpression(a, index, true, itype);
    }

    private buildObjectMember(step: number, type: Types, object: TSNode = null): TSNode {
        let propType = type ? type : st.anyType;
        let o: TSNode = object ? object : <TSNode>typeBuilder.build(step - 1, st.objectType, objMemPreference);
        if (!o)
            return null;

        // what if object does not have shape
        let shape: Weight<Pair<string, Types>>[] = (<ObjectType>(o.itype)).shape;

        // a.x (x exists)
        if (shape && shape.length) {
            let wkvs: Weight<Pair<string, Types>>[] = [];
            for (let i = 0; i < shape.length; i++) {
                let t : Types = shape[i].v.second;
                if (t && isMatch(t, propType, true)) {
                    wkvs.push(shape[i]);
                    break;
                }
            }

            if (!wkvs.length)
                return null;

            let kv : Pair<string, Types> = Random.pick(Random.weighted(wkvs));
            return this.buildKeyValue(o, kv.first, kv.second);
        } else {
            return null;
        }

        // a.x (x does not exist.)
        // let key : string = this._buildKeyString(<ObjectType>object.itype);
        // if (!key)
        //     return null;
        // return this._buildKeyValue(object, key, st.anyType);            
    }

    public build(step: number, suggestedOp: string, type: Types, object?: TSNode): TSNode {
        let op: string = suggestedOp;
        assert(!!op, "MemberExpressionBuilder");
        switch (op) {
            case "array":
                return this.buildArrayIndex(step, type, object);
            case "object":
                return this.buildObjectMember(step, type, object);
            case "typedarray":
                return this.buildTypedArrayIndex(step, type, object);
            default:
                assert(false);
        }
    }
};

// **************************************************************************************
//
// Builtin Builder
//
// **************************************************************************************
export class ArrayExpressionBuilder extends ExpressionBuilder {
    constructor() {
        super("ArrayExpression", ArrayExpressionDsps, ArrayExpressionWeight);
    }

    private buildAny(step: number): TSNode {
        let length: number = Random.number(4);
        let elements: Array<TSNode> = new Array(length);
        let i : number = 0;
        while (i < length) {
            let node: TSNode = <TSNode>typeBuilder.build(step - 1, st.anyType);
            if (node)
                elements[i++] = node;
        }
        return astBuilder.buildArrayExpression(elements, st.arrayType);
    }

    private buildNumber(step: number): TSNode {
        let length: number = Random.number(4);
        let elements: Array<TSNode> = new Array(length);
        let i : number = 0;
        while (i < length) {
            let node: TSNode = <TSNode>typeBuilder.build(step - 1, st.numberType);
            if (node)
                elements[i++] = node;
        }
        return astBuilder.buildArrayExpression(elements, st.numberArrayType);
    }

    public build(step: number, suggestedOp: string, type: Types): TSNode {
        return this["build" + suggestedOp](step, type);
    }
};

// **************************************************************************************
//
// Object Expression Builder
//
// **************************************************************************************
export class ObjectExpressionBuilder {

    constructor() {}

    private buildNumber() : TSNode {
        return this.buildShapedObject(new ObjectType([
            {w: 0xffffffff, 
             v: new Pair("valueOf", new FunctionExpressionType(new ArgsType(), st.numberType))}
        ]));
    }

    private buildString() : TSNode {
        return this.buildShapedObject(new ObjectType([
            {w: 0xffffffff, 
             v: new Pair("toString", new FunctionExpressionType(new ArgsType(), st.numberType))}
        ]));
    }

    public buildShapedObject(type : ObjectType) {
        let oProps : Array<TSNode> = [];
        for (let wkv of type.shape) {
            if (Random.number(wkv.w)) {
                let keyStr : string = wkv.v.first;
                let valueT : Types = wkv.v.second;

                let key : TSNode = astBuilder.buildIdentifier(keyStr, st.undefinedType);
                let value : TSNode = <TSNode>typeBuilder.build(builder.DEPTH, valueT);
                if (value) 
                    oProps.push(astBuilder.buildObjectProperty(key, value, false));
            }
        }
        return astBuilder.buildObjectExpression(oProps, type);
    }

    public build(step : number, op : string, type : Types) {
        switch(op) {
            case "Number":
                assert(type == st.numberType);
                return this.buildNumber();
            case "String":
                assert(type == st.stringType);
                return this.buildString();
            default:
                assert(false);
        }
    }
}

export class AssignExpressionBuilder {

    constructor() {}

    public build(left: TSNode): TSNode {

        let right: TSNode = <TSNode>typeBuilder.build(builder.DEPTH, left.itype);
        if (!right)
            return null;

        let op: string = null;
        switch (left.itype) {
            case st.numberType:
                op = Random.pick(Random.weighted([
                    { w: 20, v: "=" },
                    { w: 1, v: "*=" },
                    { w: 1, v: "**=" },
                    { w: 1, v: "/=" },
                    { w: 1, v: "%=" },
                    { w: 1, v: "+=" },
                    { w: 1, v: "-=" },
                    { w: 1, v: "<<=" },
                    { w: 1, v: ">>=" },
                    { w: 1, v: ">>>=" },
                    { w: 1, v: "&=" },
                    { w: 1, v: "^=" },
                    { w: 1, v: "|=" },
                ]));
                break;
            case st.stringType:
                op = Random.pick(Random.weighted([
                    { w: 1, v: "=" },
                    { w: 1, v: "+=" },
                ]));
                break;
            default:
                op = "=";
                break;
        }

        return astBuilder.buildAssignExpression(op, left, right);
    }
}

export class FunctionExpressionBuilder {

    constructor() {}

    public build(type : FunctionExpressionType) : TSNode {
        let id : TSNode = null;
        let params : Array<TSNode> = [];
        builder.setInFuncExp();
        let body : TSNode = builder.blockStatementBuilder.build(builder.FUNC_SIZE, type.retType);
        builder.resetInFuncExp();
        return astBuilder.buildFunctionExpression(id, params, body, false, false, type);       
    }
}
