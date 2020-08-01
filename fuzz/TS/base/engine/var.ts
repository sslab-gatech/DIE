import { inspect } from "util";
import * as t from "@babel/types";

import { TSNode } from "../esparse";
import { NodeBuilder, builder, astBuilder } from "./esbuild";
import { Dsp, VariableDsps } from "../esspecs";
import { Weight, VariableWeight } from "../esweight";
import { Types, isMatch } from "../estypes";
import { Random, assert } from "../utils";

// **************************************************************************************
//
// Variable Builder
//
// **************************************************************************************
export class VariableBuilder implements NodeBuilder {
    name: string;
    dsps: { [s: string]: Dsp };
    weights: Array<Weight<keyof (typeof VariableDsps)>>;

    constructor() {
        this.name = "Variable";
        this.dsps = VariableDsps;
        this.weights = VariableWeight;
    }

    public build(step: number, suggestedOp: string, type: Types): TSNode {
        let vars: Array<TSNode> = [];
        for (let node of builder.context.variables) {
            if (isMatch(node.itype, type, false)) {
                vars.push(node);
            }
        }
        let v: TSNode = Random.pick(vars);
        if (!v)
            return null;
        
        return astBuilder.buildIdentifier((<t.Identifier><t.BaseNode>v).name, v.itype); 
    }
}
