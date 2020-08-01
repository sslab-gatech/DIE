import { inspect } from "util";
import * as bt from "@babel/types";
import { TSNode } from "../esparse";
import { Random, assert, printf } from "../utils";
import { BuiltinBuilder } from "./builtin";
import { stmtBuilder, typeBuilder, astBuilder, builder } from "./esbuild";
import { Types, ObjectType, AnyType, FunctionType, st } from "../estypes";
import { initPreference } from "../espreference";

export class BlockStatementBuilder {

    constructor() {}

    public build(n : number, retType : Types = null) : TSNode {
        let body : Array<TSNode> = new Array(n);

        let cnt : number = 0;
        while (cnt < n) {
            let node : TSNode = stmtBuilder.build();
            if (node)
                body[cnt++] = node;
        }

        if (retType) {
            let retArg : TSNode = <TSNode>typeBuilder.build(builder.DEPTH, retType);
            if (retArg)
                body.push(astBuilder.buildReturnStatement(retArg));
        }

        return astBuilder.buildBlockStatement(body);
    }
}

export class StatementBuilder {
    constructor() {}

    private genNumberStmt(step : number, v : TSNode) : TSNode {
        const ASSIGN : number = 0, UPDATE : number = 1, UNARY : number = 2;
        let choice : 0 | 1 | 2 = Random.pick(Random.weighted([
            {w: 4, v: ASSIGN},
            {w: 1, v: UPDATE},
            {w: 1, v: UNARY},
        ]));
        switch (choice) {
            case ASSIGN:
                return builder.assignExpressionBuilder.build(v);
            case UPDATE:
                return builder.UpdateExpressionBuilder.build(0, null, null, v);
            case UNARY:
                let op: string = Random.pick(["+", "-"]);
                return builder.UnaryExpressionBuilder.build(0, op, null, v);
            default:
                assert(false);
        }
    }
    
    private genStringStmt(step : number, v : TSNode) : TSNode {
        const ASSIGN : number = 0, BUILTIN = 1;
        let choice : 0 | 1 = Random.pick(Random.weighted([
            {w: 1, v: ASSIGN},
            {w: 1, v: BUILTIN},
        ]));
        switch (choice) {
            case ASSIGN:
                return builder.assignExpressionBuilder.build(v);
            case BUILTIN:
                return this.genBuiltinStmt(step, v);
        }
    }

    private genBooleanStmt(step : number, v : TSNode) : TSNode {
        const ASSIGN : number = 0;
        let choice : 0 | 1 = Random.pick(Random.weighted([
            {w: 1, v: ASSIGN},
        ]));
        switch (choice) {
            case ASSIGN:
                return builder.assignExpressionBuilder.build(v);
        }
    }

    private genArrayStmt(step : number, v : TSNode) : TSNode {
        const ASSIGN : number = 0, INDEX : number = 1, BUILTIN : number = 2;
        let choice : 0 | 1 | 2 = Random.pick(Random.weighted([
            {w: 1, v: ASSIGN},
            {w: step ? 10 : 0, v: INDEX},
            {w: 10, v: BUILTIN},
        ]));

        switch (choice) {
            case ASSIGN:
                return builder.assignExpressionBuilder.build(v);
            case INDEX:
                let object : TSNode = builder.MemberExpressionBuilder.build(step, "array", null, v);
                if (!object)
                    return null;
                return this.genObjBasedStmt(step - 1, object);
            case BUILTIN:
                return this.genBuiltinStmt(step, v);
        }
    }

    private genTypedArrayStmt(step : number, v : TSNode) : TSNode {
        const ASSIGN : number = 0, INDEX : number = 1, BUILTIN : number = 2;
        let choice : 0 | 1 | 2 = Random.pick(Random.weighted([
            {w: 1, v: ASSIGN},
            {w: step ? 10 : 0, v: INDEX},
            {w: 10, v: BUILTIN},
        ]));

        switch (choice) {
            case ASSIGN:
                return builder.assignExpressionBuilder.build(v);
            case INDEX:
                let object : TSNode = builder.MemberExpressionBuilder.build(step, "typedarray", null, v);
                if (!object)
                    return null;
                return this.genObjBasedStmt(step - 1, object);
            case BUILTIN:
                return this.genBuiltinStmt(step, v);
        }
    }

    private genObjectStmt(step : number, v : TSNode) : TSNode {
        const ASSIGN : number = 0, MEMBER : number = 1, BUILTIN : number = 2;
        let type : ObjectType | AnyType = v.itype;
        let hasMember : boolean = false;
        if (type instanceof ObjectType 
                && type.shape && type.shape.length)
            hasMember = true;

        let choice : 0 | 1 | 2 = Random.pick(Random.weighted([
            {w: 1, v: ASSIGN},
            {w: (step && hasMember) ? 10 : 0, v: MEMBER},
            {w: 10, v: BUILTIN},
        ]));

        switch (choice) {
            case ASSIGN:
                return builder.assignExpressionBuilder.build(v);
            case MEMBER:
                let object : TSNode = builder.MemberExpressionBuilder.build(step, "object", null, v);
                if (!object)
                    return null;
                return this.genObjBasedStmt(step - 1, object);
            case BUILTIN:
                return this.genBuiltinStmt(step, v);
        }
    }

    // =======================================
    private genBuiltinStmt(step: number, object: TSNode): TSNode {
        const PROPERTY: number = 0, FUNCTION: number = 1;
        let typeName : string = object.itype.type == "Any" ? "Object" : object.itype.type;
        let b : BuiltinBuilder = builder.builtinBuilders[typeName];
        let choice : 0 | 1 = Random.pick(Random.weighted([
            {w: 1, v: PROPERTY},
            {w: 1, v: FUNCTION}
        ]))
        let suggestedOp: string = null;
        switch (choice) {
            case PROPERTY:
                suggestedOp = Random.pick(Random.weighted(b.wPropDsps));
                break;
            case FUNCTION:
                suggestedOp = Random.pick(Random.weighted(b.wFuncDsps));
                break;
        } 
        let node : TSNode = b.build(step, suggestedOp, null, object);
        if (choice == PROPERTY) {
            return this.genObjBasedStmt(step - 1, node);
        }
        return node;
    }

    // =======================================
    private genFunctionStmt(step : number, func : TSNode) : TSNode {

        if (!bt.isIdentifier(func)) {
            printf(func);
            return null;
        }

        if (builder.context.funcParentNode && func === <TSNode><bt.BaseNode>(builder.context.funcParentNode.id))
            return null;

        let type : FunctionType = <FunctionType>func.itype;
        let args : Array<TSNode> = <Array<TSNode>>typeBuilder.build(step - 1, type.argTypes);
        if (!args) {
            return null;
        }

        let call : TSNode = astBuilder.buildCallExpression(func, args, type);
        if (call)
            return call;
        else
            return null;
    }

    private genIteratorStmt(step : number, object : TSNode) : TSNode {
        return null;
    }

    // =======================================
    private genObjBasedStmt(step : number, object : TSNode = null) : TSNode {
        let o : TSNode = object ? object : builder.context.getVariable();
        if (!o)
            return null;

        assert(!!o.itype, inspect(o));
        switch (o.itype.type) {
            case "Number":
                return this.genNumberStmt(step, o);
            case "String":
                return this.genStringStmt(step, o);
            case "Boolean":
                return this.genBooleanStmt(step, o);
            case "Array":
                return this.genArrayStmt(step, o);
            case "TypedArray":
                return this.genTypedArrayStmt(step, o);
            case "Function":
                return this.genFunctionStmt(step, o);
            case "Any":
            case "Object":
                return this.genObjectStmt(step, o);
            case "Date":
            case "RegExp":
            case "Map":
            case "Set":
            case "WeakMap":
            case "WeakSet":
            case "ArrayBuffer":
            case "DataView":
                return this.genBuiltinStmt(step, o);
            case "Iterator":            
                return this.genIteratorStmt(step, o);
            default:   
                return null;
        }
    }

    private genConstructorStmt(step : number) : TSNode {
        let name : string = Random.pick(Random.weighted(builder.context.ctorWeights));
        let b : BuiltinBuilder = builder.builtinCtorBuilders[name + "Ctor"];
        assert(!!b, name);
        return b.build(step, Random.pick(Random.weighted(b.wFuncDsps)), null); 
    }

    private genProtoTypeStmt(step: number): TSNode {
        return null;
    }

    private typesForNewVar = Random.weighted([
        { w: 10, v: st.numberType },
        { w: 10, v: st.objectType },
        { w: 10, v: st.arrayType },
        { w: 10, v: st.numberArrayType },
        { w: 10, v: st.typedarrayType },
        { w: 5, v: st.stringType },
        { w: 1, v: st.dateType },
        { w: 1, v: st.regexpType },
        { w: 1, v: st.mapType }, 
        { w: 1, v: st.setType },
        { w: 1, v: st.anyType },
    ]);

    private genNewVar(step: number): TSNode {
        let varT: Types = Random.pick(this.typesForNewVar);
        let init: TSNode = <TSNode>typeBuilder.build(step, varT, initPreference);
        if (!init)
            return null;
        let id: TSNode = astBuilder.buildIdentifier(builder.genVarId(), init.itype);
        return astBuilder.buildVariableDeclarator(id, init);
    }

    public build() : TSNode {
        let stmt: TSNode = null, decl: TSNode = null;
        const OBJBASED: number = 0, CTRBASED: number = 1, MODPROTO: number = 2, NEWVAR: number = 3;
        let weights = Random.weighted([
            {w: Math.min(builder.context.variables.length, 10), v: OBJBASED},
            {w: 1,  v: NEWVAR},
            {w: 1,  v: CTRBASED},
            {w: 0,  v: MODPROTO},
        ]);

        const MAX_TRY_TIMES = 3;
        //for (let i = 0; i < MAX_TRY_TIMES; i++) {
            let choice : number = Random.pick(weights);
            switch (choice) {
                case OBJBASED:
                    stmt = this.genObjBasedStmt(builder.DEPTH);
                    break;
                case NEWVAR:
                    decl = this.genNewVar(builder.DEPTH);
                    break;
                case CTRBASED:
                    stmt = this.genConstructorStmt(builder.DEPTH);
                    break;
                case MODPROTO:
                    stmt = this.genProtoTypeStmt(builder.DEPTH);
                    break;
            }

            if (stmt)
                return astBuilder.buildExpressionStatement(stmt);

            if (decl)
                return astBuilder.buildVariableDeclaration("var", decl);
        //}
        return null;
    }
}
