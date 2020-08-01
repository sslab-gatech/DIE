import { NodePath } from "@babel/traverse";

import { TSNode } from "../esparse";
import { BuildingContext } from "./context";
import { Random, printf, assert } from "../utils";
import { Preference, defaultPreference } from "../espreference";
import { builder, funcExpBuilder, objExpBuilder, BuildInfo, typeBuilder } from "./esbuild";
import { ArgsType, Types, FunctionExpressionType, ObjectType, st, getCompatibleBaseTypes, isMatch } from "../estypes";
import { MutateChange, MUTATE_NODE } from "../esmutator";
import { TestCase } from "../estestcase";

export class TypeBuilder {

    constructor() {}

    private buildArgsType(step: number, type: ArgsType): TSNode[] {
        let args: TSNode[] = [];
        for (let argType of type.args) {
            if (argType.optional && Random.bool())
                break;
            // if an argument can appear infinite times, 
            // let's restrict it from 1 ~ 4.
            let n: number = argType.infinite ? Random.range(1, 5) : 1;
            for (let i = 0; i < n; i++) {
                let arg: TSNode = <TSNode>this.build(step, argType.atype);
                if (!arg) {
                    return null;
                }
                args.push(arg);
            }
        }
        return args;
    }

    public build(step : number, type : Types, pref : Preference = defaultPreference) : TSNode | TSNode[] { 

        // for ArgsType, we return TSNode[]
        if (type instanceof ArgsType) {
            return this.buildArgsType(step, type);
        }

        // for FunctionExpressionType, we directly build
        if (type instanceof FunctionExpressionType) {
            if (builder.isInFuncExp())
                return null;
            else
                return funcExpBuilder.build(type);
        }

        // for ObjectType with a shape, we directly build
        if (type === st.propertyType || type === st.proxyhandlerType) {
            return objExpBuilder.buildShapedObject(<ObjectType>type);
        }

        let ret: TSNode = null;

        let varInfo: BuildInfo[] = [];
        let litInfo: BuildInfo[] = [];
        let memInfo: BuildInfo[] = [];
        let expInfo: BuildInfo[] = [];
        let buiInfo: BuildInfo[] = [];
        let buicInfo: BuildInfo[] = [];
        let defInfo: BuildInfo[] = [];

        let context: BuildingContext = builder.context;
        let baseTypes: Array<Types> = type === st.anyType ? [...context.typeMap.keys()] : getCompatibleBaseTypes(type, pref.objectLike);

        for (let bt of baseTypes) {
            if (context.typeMap.has(bt)) {
                context.typeMap.get(bt).forEach((t: Types) => {
                    if (isMatch(t, type, pref.objectLike)) {
                        if (!pref.noVars && context.varMap.has(t)) {
                            varInfo = varInfo.concat(context.varMap.get(t));
                        }
                        if (!pref.noLits && context.literalMap.has(t)) {
                            litInfo = litInfo.concat(context.literalMap.get(t));
                        }
                        if (!pref.noMems && context.memExpMap.has(t)) {
                            memInfo = memInfo.concat(context.memExpMap.get(t));
                        }
                        if (!pref.noExps && context.expMap.has(t)) {
                            expInfo = expInfo.concat(context.expMap.get(t));
                        }
                        if (!pref.noBuis && context.builtinMap.has(t)) {
                            buiInfo = buiInfo.concat(context.builtinMap.get(t));
                        }
                        if (!pref.noBuis && context.builtinCtorMap.has(t)) {
                            buicInfo = buicInfo.concat(context.builtinCtorMap.get(t));
                        }
                        if (!pref.noDefs && context.defineMap.has(t)) {
                            defInfo = defInfo.concat(context.defineMap.get(t));
                        }
                    }
                });
            }
        }
         
        let solutions = Random.weighted([
            { w: varInfo.length ? 5 : 0, v: varInfo },
            { w: litInfo.length ? 1 : 0, v: litInfo },
            { w: (step && memInfo.length) ? 5 : 0, v: memInfo },
            { w: (step && expInfo.length) ? 5 : 0, v: expInfo },
            { w: (step && buiInfo.length) ? 5 : 0, v: buiInfo },
            { w: (step && buicInfo.length) ? 1 : 0, v: buicInfo },
            { w: (step && defInfo.length) ? 1 : 0, v: defInfo },
        ]);
        if (!solutions.length)
            return null;

        let bis: BuildInfo[] = Random.pick(solutions);
        assert(!!bis.length);
        let x = Random.pick(Random.weighted(bis));
        ret = x.b.build(step, x.o, type);
        return ret;
    }
}
