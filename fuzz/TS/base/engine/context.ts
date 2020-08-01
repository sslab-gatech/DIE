import { inspect } from "util";
import * as bt from "@babel/types";
import { TestCase } from "../estestcase";
import { Node, NodePath, Binding } from "@babel/traverse";

import { Weight } from "../esweight";
import { TSNode } from "../esparse";
import { BuiltinBuilder } from "./builtin";
import { Dsp, FunctionDsp } from "../esspecs";
import { Random, assert, printf } from "../utils";
import { BuildInfo, NodeBuilder, literalBuilder, builder } from "./esbuild";
import { Types, getCompatibleBaseTypes, st, ObjectType, FunctionExpressionType, ArgsType, FunctionType } from "../estypes";

// *************************************************************************************
//
// Building Context
//
// *************************************************************************************
export class BuildingContext {

    tc: TestCase;
    path: NodePath;
    variables: Array<TSNode>;

    // 0: mutate
    // 1: insert
    mode: number;

    typeMap: Map<Types, Set<Types>>;
    rules: Set<String>;
    literalMap: Map<Types, BuildInfo[]>;
    varMap: Map<Types, BuildInfo[]>;
    memExpMap: Map<Types, BuildInfo[]>;
    expMap: Map<Types, BuildInfo[]>;
    builtinMap: Map<Types, BuildInfo[]>;
    builtinCtorMap: Map<Types, BuildInfo[]>; 
    defineMap: Map<Types, BuildInfo[]>;
    ctorWeights : Array<Weight<string>>;

    funcParentNode : bt.FunctionDeclaration;

    private getRule(builder: NodeBuilder, op: String) {
        return builder.name + "_" + op;
    }

    private setTypedMap(map: Map<Types, BuildInfo[]>, type: Types, info: BuildInfo) {
        let baseTypes: Array<Types> = getCompatibleBaseTypes(type, false);
        assert(!!baseTypes.length, "No base types: type : " + inspect(type, false, 2));

        this.rules.add(this.getRule(info.v.b, info.v.o));
        for (let baseType of baseTypes) {
            if (!this.typeMap.has(baseType)) {
                this.typeMap.set(baseType, new Set([type]));
            } else {
                this.typeMap.get(baseType).add(type);
            }
        }
        if (!map.has(type)) {
            map.set(type, [info]);
        } else {
            map.get(type).push(info);
        }
    }

    private isTypeSupported(type: Types): boolean {
        if (type === st.anyType 
            || type instanceof ObjectType 
            || type instanceof FunctionExpressionType)
            return true;
        
        let baseTypes : Array<Types> = getCompatibleBaseTypes(type, false);
        for (let baseType of baseTypes) {
            if (this.typeMap.has(baseType))
                return true;
        }
        return false;
    }

    private isArgsTypeSupported(args: ArgsType): boolean {
        if (!args || !args.args.length)
            return true;
        for (let arg of args.args) {
            if (!this.isTypeSupported(arg.atype))
                return false;
        }
        return true;
    }

    private tryImportBuilder(map: Map<Types, BuildInfo[]>, builder: NodeBuilder, dsps: { [s: string]: Dsp }, weights: Array<Weight<any>>, needsCheck : boolean = true): boolean {
        let isUpdated: boolean;
        for (let op of weights) {
            let dsp: Dsp = dsps[op.v];
            let rule: string = this.getRule(builder, op.v);
            if (!this.rules.has(rule)) {
                if (this.isArgsTypeSupported(dsp.args)
                    // for functions, we need to also check dsp.object
                    && (!(dsp instanceof FunctionDsp) || this.isTypeSupported(dsp.object))) {
                    this.setTypedMap(map, dsp.type, { w: op.w, v: { b: builder, o: op.v } });
                    isUpdated = true;
                }
            }
        }
        return isUpdated;
    }

    private isValidBinding(binding: Binding) : boolean {
        let v: TSNode = <TSNode><bt.BaseNode>binding.identifier;
        switch(this.mode) {
            // MUTATE
            case 0:
                return this.path.node.loc.start.line > v.loc.start.line;
                //        || v.itype instanceof FunctionType;

            // INSERT
            /*
            var x = 3; [1]: x
            function f(a) { [2]: f (but not a)
                function y1() {}
            }
            <--
            function y2() { [3]: y2 (but not y1)

            }
            currently, we do not want to call y2
            */
            case 1:
                if (this.path.node.loc.start.line > v.loc.start.line) { // [1]
                    return true;
                } else if (this.path.node.loc.start.line == v.loc.start.line) { // [2]
                    return (this.path.isFunctionDeclaration() && <Node>this.path.node.id === v);
                } // else if (v.itype instanceof FunctionType) { // [3]
                //    return this.path.node !== binding.scope.block;
                // }
                return false;
            default:
                assert(false);
        }
    }

    private isNotInterestingCtors(name: string): boolean {
        return name == "Function" 
            || name == "Error" 
            || name == "Promise"
            || name == "Proxy" 
            || name == "Symbol" 
            || name == "Boolean"
            || name == "Reflect";
    }

    constructor(tc: TestCase, path: NodePath, mode: number) {
        this.tc = tc;
        this.path = path;
        this.mode = mode;
        this.variables = [];
        this.ctorWeights = [];

        this.typeMap = new Map();
        this.rules = new Set();
        this.literalMap = new Map();
        this.varMap = new Map();
        this.memExpMap = new Map();
        this.expMap = new Map();
        this.builtinMap = new Map();
        this.builtinCtorMap = new Map();
        this.defineMap = new Map();

        let availCtors : Set<string> = new Set(); 
        availCtors.add("Number");
        availCtors.add("Object");

        // Import generation rules
        // (1) import all the literal types
        this.tryImportBuilder(this.literalMap, literalBuilder, literalBuilder.dsps, literalBuilder.weights);
        let node = path.node;
        // (2) import available bindings (also, their constructors)
        let bindings = this.path.scope.getAllBindings();
        for (let id in bindings) {
            let binding: Binding = bindings[id];
            if (this.isValidBinding(binding)) {
                let v: TSNode = <TSNode><bt.BaseNode>binding.identifier;
                if (v.itype) {
                    this.variables.push(v);
                    this.setTypedMap(this.varMap, v.itype, { w: 1, v: { b: builder.varBuilder, o: "var" } });

                    // put existing types' constructor
                    let ctorName: string = v.itype.type;
                    if (ctorName in st.constructorTypes && !this.isNotInterestingCtors(ctorName)) {
                        availCtors.add(ctorName);
                    }
                }
            }
        }

        // set available constructors to use
        availCtors.forEach((ctorName: string) => {
            this.ctorWeights.push({w: 1, v: ctorName});
            this.setTypedMap(this.literalMap, st.constructorTypes[ctorName],
                { w: 1, v: { b: builder.LiteralBuilder, o: "BuiltinConstructor" } });
        });

        // (3) iterate all the other expressions
        let updated: boolean;
        do {
            updated = false;
            // Expressions
            if (this.tryImportBuilder(this.memExpMap, builder.MemberExpressionBuilder,
                    builder.MemberExpressionBuilder.dsps, builder.MemberExpressionBuilder.weights))
                updated = true;

            if (this.tryImportBuilder(this.expMap, builder.BinaryExpressionBuilder,
                    builder.BinaryExpressionBuilder.dsps, builder.BinaryExpressionBuilder.weights))
                updated = true;

            if (this.tryImportBuilder(this.expMap, builder.UnaryExpressionBuilder,
                    builder.UnaryExpressionBuilder.dsps, builder.UnaryExpressionBuilder.weights))
                updated = true;

            if (this.tryImportBuilder(this.expMap, builder.UpdateExpressionBuilder,
                    builder.UpdateExpressionBuilder.dsps, builder.UpdateExpressionBuilder.weights))
                updated = true;

            if (this.tryImportBuilder(this.expMap, builder.LogicalExpressionBuilder,
                    builder.LogicalExpressionBuilder.dsps, builder.LogicalExpressionBuilder.weights))
                updated = true;

            // Builtin Properties and Functions
            for (let name in builder.builtinBuilders) {
                let b : BuiltinBuilder = builder.builtinBuilders[name];
                this.tryImportBuilder(this.builtinMap, b, b.propDsps, b.wPropDsps);
                this.tryImportBuilder(this.builtinMap, b, b.funcDsps, b.wFuncDsps);
            }

            // Builtin Constructor Properties and Functions
            for (let name in builder.builtinCtorBuilders) {
                let b : BuiltinBuilder = builder.builtinCtorBuilders[name];
                this.tryImportBuilder(this.builtinCtorMap, b, b.propDsps, b.wPropDsps);
                this.tryImportBuilder(this.builtinCtorMap, b, b.funcDsps, b.wFuncDsps);
            }

        } while (updated);

        // Declaration Expressions
        this.tryImportBuilder(this.defineMap, builder.NewExpressionBuilder,
            builder.NewExpressionBuilder.dsps, builder.NewExpressionBuilder.weights);

        this.tryImportBuilder(this.defineMap, builder.ArrayExpressionBuilder,
            builder.ArrayExpressionBuilder.dsps, builder.ArrayExpressionBuilder.weights);

        // get the function the current node resides in 
        let funcParent : NodePath = path.getFunctionParent();
        if (funcParent && bt.isFunctionDeclaration(funcParent.node)) {
            this.funcParentNode = funcParent.node; 
        }

    }

    getVariable(): TSNode {
        return Random.pick(this.variables);
    }
}
