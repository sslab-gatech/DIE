import { Random, dbglog, assert, printf } from "../utils";
import { TSNode } from "../esparse";
import { Weight, LiteralWeight } from "../esweight";
import { Types, st, ConstructorType} from "../estypes";
import { NodeBuilder, astBuilder, builder } from "./esbuild";
import { Dsp, LiteralDsps, TypedArrayNames } from "../esspecs";

import * as NUMBER from "../const/number";
import * as STRING from "../const/string";
import * as REGEXP from "../const/regexp";
import * as bt from "@babel/types";

// **************************************************************************************
//
// Literal Builder
//
// **************************************************************************************
export class LiteralBuilder implements NodeBuilder {
    name: string;
    dsps: { [s: string]: Dsp };
    weights: Array<Weight<keyof (typeof LiteralDsps)>>;

    constructor() {
        this.name = "Literal";
        this.dsps = LiteralDsps;
        this.weights = LiteralWeight;
    }

    private buildBoolean() : TSNode {
        let value : boolean = Random.bool(); 
        return astBuilder.buildBooleanLiteral(value);
    }

    private buildString() : TSNode {
        let s : string;
        let a : Array<string> = builder.context.tc.getStringLiterals();
        // 2/3 to use existing numbers
        if (!a.length || !Random.number(3)) {
            s = STRING.gen();
        } else {
            s = Random.pick(a);
        }
        return astBuilder.buildStringLiteral(s);
    }

    private buildNumber() : TSNode {
        let value : number;
        let a : Array<number> = builder.context.tc.getNumberLiterals();
        // 2/3 to use existing numbers
        if (!a.length || !Random.number(3)) {
            value = NUMBER.gen();
        } else {
            value = Random.pick(a);
        }
        // minus numeric literal is unaryExpression in fact.
        let ret : TSNode;
        if(value >= 0)
            ret = astBuilder.buildNumericLiteral(value);
        else 
            ret = astBuilder.buildUnaryExpression("-", astBuilder.buildNumericLiteral(value * -1), true, st.numberType);
        return ret;
    }

    private buildNull() : TSNode {
        return astBuilder.buildNullLiteral();
    }

    private buildRegExp() : TSNode {
        let re : RegExp = REGEXP.gen();
        return astBuilder.buildRegExpLiteral(re.source, re.flags);
    }

    public buildBuiltinConstructor(type : Types) {
        let t : Types = type;
        if (st.isBuiltinConstructor(type)) {
            let name: string = (<ConstructorType>type).name;
            if (name == "TypedArray")
                return astBuilder.buildIdentifier(Random.pick(TypedArrayNames), type);
            else
                return astBuilder.buildIdentifier(name, type);
        } else {
            return null;
        }
    }

    private buildMath() {
        return astBuilder.buildIdentifier("Math", st.mathType);
    }

    public buildPrototype(name : string) : TSNode {
        if (name == "TypedArray")
            name = Random.pick(TypedArrayNames);
        let ctor : TSNode = astBuilder.buildIdentifier(name, st.constructorTypes[name]);
        //assert(ctor.itype != undefined, name)
        let property : TSNode = astBuilder.buildIdentifier("prototype", st.voidType);
        return astBuilder.buildMemberExpression(ctor, property, false, st.prototypeTypes[name]);
    }

    public build(step : number, suggestedOp : string, type : Types) : TSNode {
        return this["build" + suggestedOp](type);
    }
}
