import { Random } from "../utils";
import { TSNode } from "../esparse";
import { NodeBuilder, literalBuilder, astBuilder, typeBuilder } from "./esbuild";
import { Dsps, Types, st } from "../estypes";
import { Weight, NumberConstructorPropertyWeight, NumberConstructorFunctionWeight, NumberFunctionWeight, MathPropertyWeight, MathFunctionWeight, DateConstructorPropertyWeight, DateConstructorFunctionWeight, DatePropertyWeight, DateFunctionWeight, StringConstructorFunctionWeight, StringPropertyWeight, StringFunctionWeight, RegExpConstructorPropertyWeight, RegExpPropertyWeight, RegExpFunctionWeight, ArrayConstructorFunctionWeight, ArrayPropertyWeight, ArrayFunctionWeight, TypedArrayConstructorPropertyWeight, TypedArrayConstructorFunctionWeight, TypedArrayProepertyWeight, TypedArrayFunctionWeight, MapPropertyWeight, MapFunctionWeight, SetFunctionWeight, WeakMapPropertyWeight, WeakMapFunctionWeight, WeakSetFunctionWeight, ArrayBufferConstructorFunctionWeight, ArrayBufferPropertyWeight, ArrayBufferFunctionWeight, DataViewPropertyWeight, DataViewFunctionWeight, FunctionPropertyWeight, FunctionFunctionWeight, ObjectConstructorPropertyWeight, ObjectConstructorFunctionWeight, ObjectPropertyWeight, ObjectFunctionWeight, IteratorFunctionWeight, MapConstructorPropertyWeight, SetPropertyWeight, SetConstructorPropertyWeight, WeakMapConstructorPropertyWeight, WeakSetPropertyWeight, WeakSetConstructorPropertyWeight, ArrayBufferConstructorPropertyWeight, DataViewConstructorPropertyWeight, FunctionConstructorPropertyWeight } from "../esweight";
import { NumberConstructorPropertyDsps, DateConstructorPropertyDsps, StringConstructorPropertyDsps, RegExpConstructorPropertyDsps, ArrayConstructorPropertyDsps, TypedArrayConstructorPropertyDsps, MapConstructorPropertyDsps, SetConstructorPropertyDsps, WeakMapConstructorPropertyDsps, WeakSetConstructorPropertyDsps, ArrayBufferConstructorPropertyDsps, DataViewConstructorPropertyDsps, FunctionConstructorPropertyDsps, ObjectConstructorPropertyDsps, NumberConstructorFunctionDsps, DateConstructorFunctionDsps, StringConstructorFunctionDsps, ArrayConstructorFunctionDsps, TypedArrayConstructorFunctionDsps, ArrayBufferConstructorFunctionDsps, ObjectConstructorFunctionDsps, MathPropertyDsps, DatePropertyDsps, StringPropertyDsps, RegExpPropertyDsps, ArrayPropertyDsps, TypedArrayPropertyDsps, MapPropertyDsps, SetPropertyDsps, WeakMapPropertyDsps, WeakSetPropertyDsps, ArrayBufferPropertyDsps, DataViewPropertyDsps, FunctionPropertyDsps, ObjectPropertyDsps, NumberFunctionDsps, MathFunctionDsps, DateFunctionDsps, StringFunctionDsps, RegExpFunctionDsps, ArrayFunctionDsps, TypedArrayFunctionDsps, MapFunctionDsps, SetFunctionDsps, WeakMapFunctionDsps, WeakSetFunctionDsps, ArrayBufferFunctionDsps, DataViewFunctionDsps, FunctionFunctionDsps, ObjectFunctionDsps, IteratorFunctionDsps, PropertyDsp, FunctionDsp } from "../esspecs";

// **************************************************************************************
//
// Builtin Builder
//
// **************************************************************************************
type BuiltinPKeys = 
    keyof typeof MathPropertyDsps |
    keyof typeof DatePropertyDsps |
    keyof typeof StringPropertyDsps |
    keyof typeof RegExpPropertyDsps |
    keyof typeof ArrayPropertyDsps |
    keyof typeof TypedArrayPropertyDsps |
    keyof typeof MapPropertyDsps |
    keyof typeof SetPropertyDsps |
    keyof typeof WeakMapPropertyDsps |
    keyof typeof WeakSetPropertyDsps |
    keyof typeof ArrayBufferPropertyDsps |
    keyof typeof DataViewPropertyDsps |
    keyof typeof FunctionPropertyDsps |
    keyof typeof ObjectPropertyDsps |

    keyof typeof NumberConstructorPropertyDsps |
    keyof typeof DateConstructorPropertyDsps |
    keyof typeof StringConstructorPropertyDsps |
    keyof typeof RegExpConstructorPropertyDsps |
    keyof typeof ArrayConstructorPropertyDsps |
    keyof typeof TypedArrayConstructorPropertyDsps |
    keyof typeof MapConstructorPropertyDsps |
    keyof typeof SetConstructorPropertyDsps |
    keyof typeof WeakMapConstructorPropertyDsps |
    keyof typeof WeakSetConstructorPropertyDsps |
    keyof typeof ArrayBufferConstructorPropertyDsps |
    keyof typeof DataViewConstructorPropertyDsps |
    keyof typeof FunctionConstructorPropertyDsps |
    keyof typeof ObjectConstructorPropertyDsps;

type BuiltinFKeys = 
    keyof typeof NumberFunctionDsps |
    keyof typeof MathFunctionDsps |
    keyof typeof DateFunctionDsps |
    keyof typeof StringFunctionDsps |
    keyof typeof RegExpFunctionDsps |
    keyof typeof ArrayFunctionDsps |
    keyof typeof TypedArrayFunctionDsps |
    keyof typeof MapFunctionDsps |
    keyof typeof SetFunctionDsps |
    keyof typeof WeakMapFunctionDsps |
    keyof typeof WeakSetFunctionDsps |
    keyof typeof ArrayBufferFunctionDsps |
    keyof typeof DataViewFunctionDsps |
    keyof typeof FunctionFunctionDsps |
    keyof typeof ObjectFunctionDsps | 
    keyof typeof IteratorFunctionDsps |

    keyof typeof NumberConstructorFunctionDsps |
    keyof typeof DateConstructorFunctionDsps |
    keyof typeof StringConstructorFunctionDsps |
    keyof typeof ArrayConstructorFunctionDsps |
    keyof typeof TypedArrayConstructorFunctionDsps |
    keyof typeof ArrayBufferConstructorFunctionDsps |
    keyof typeof ObjectConstructorFunctionDsps;

export class BuiltinBuilder implements NodeBuilder {

    name: string;
    isCtor: boolean;

    propDsps: Dsps<PropertyDsp>;
    wPropDsps: Array<Weight<BuiltinPKeys>>;

    funcDsps: Dsps<FunctionDsp>;
    wFuncDsps: Array<Weight<BuiltinFKeys>>;

    constructor(gBuiname: string, isCtor: boolean, 
        pd: Dsps<PropertyDsp>, pdw: Array<Weight<BuiltinPKeys>>,
        fd: Dsps<FunctionDsp>, fdw: Array<Weight<BuiltinFKeys>>) {
        this.name = gBuiname;
        this.propDsps = pd;
        this.wPropDsps = pdw;
        this.funcDsps = fd;
        this.wFuncDsps = fdw;
        this.isCtor = isCtor;
    }

    private buildProp(step : number, suggestedProp : string, type : Types, object : TSNode) : TSNode {
        if (this["build" + suggestedProp])
            return this["build" + suggestedProp](step, type);
        let dsp : PropertyDsp = this.propDsps[suggestedProp];
        let o : TSNode = object ? object : <TSNode>typeBuilder.build(step - 1,  dsp.object);
        if (!object)
            return null;
        let property : TSNode = astBuilder.buildIdentifier(dsp.property, st.voidType);
        return astBuilder.buildMemberExpression(o, property, false, dsp.type);
    }

    private buildFunc(step : number, suggestedFunc : string, type : Types, object : TSNode) : TSNode {
        if (this["build" + suggestedFunc])
            return this["build" + suggestedFunc](step, type);
        let dsp : FunctionDsp  = this.funcDsps[suggestedFunc];
        let o : TSNode = object ? object : <TSNode>typeBuilder.build(step - 1, dsp.object);
        if (!o)
            return null;
        let args : Array<TSNode> = <Array<TSNode>>typeBuilder.build(step - 1, dsp.args); 
        if (!args)
            return null;
        let property : TSNode = astBuilder.buildIdentifier(dsp.method, null);
        // Math is an object; does not have a special prototype
        if (this.isCtor || Random.number(4)) {
            let callee : TSNode = astBuilder.buildMemberExpression(o, property, false, st.functionType);
            return astBuilder.buildCallExpression(callee, args, dsp.type);
        } else {
            let proto : TSNode = literalBuilder.buildPrototype(this.name);
            let call : TSNode = astBuilder.buildIdentifier("call", null);
            let func : TSNode = astBuilder.buildMemberExpression(proto, property, false, st.functionType);
            let callee : TSNode = astBuilder.buildMemberExpression(func, call, false, st.functionType);
            args.unshift(o);
            return astBuilder.buildCallExpression(callee, args, dsp.type);
        }
    }

    public build(step : number, suggestedOp : string, type : Types, object : TSNode = null) {
        if (this.funcDsps[suggestedOp] instanceof FunctionDsp) {
            return this.buildFunc(step, suggestedOp, type, object);
        } else if (this.propDsps[suggestedOp] instanceof PropertyDsp) {
            return this.buildProp(step, suggestedOp, type, object);
        }     
    }
}

export class NumberBuilder extends BuiltinBuilder {
    constructor() {
        super("Number", false,
            {}, [],
            NumberFunctionDsps, NumberFunctionWeight
        );
    }
}

export class NumberCtorBuilder extends BuiltinBuilder {
    constructor() {
        super("NumberCtor", true,
            NumberConstructorPropertyDsps, NumberConstructorPropertyWeight,
            NumberConstructorFunctionDsps, NumberConstructorFunctionWeight,
        );
    }
}
export class MathBuilder extends BuiltinBuilder {
    constructor() {
        super("Math", true,
            MathPropertyDsps, MathPropertyWeight,
            MathFunctionDsps, MathFunctionWeight
        );
    }
}

export class DateBuilder extends BuiltinBuilder {
    constructor() {
        super("Date", false,
            DatePropertyDsps, DatePropertyWeight,
            DateFunctionDsps, DateFunctionWeight);
    }
}

export class DateCtorBuilder extends BuiltinBuilder {
    constructor() {
        super("DateCtor", true,
            DateConstructorPropertyDsps,
            DateConstructorPropertyWeight,
            DateConstructorFunctionDsps,
            DateConstructorFunctionWeight);
    }
}

export class StringBuilder extends BuiltinBuilder {
    constructor() {
        super("String", false,
            StringPropertyDsps, 
            StringPropertyWeight,
            StringFunctionDsps, 
            StringFunctionWeight);
    }
}

export class StringCtorBuilder extends BuiltinBuilder {
    constructor() {
        super("StringCtor", true,
            StringConstructorPropertyDsps, 
            DateConstructorPropertyWeight,
            StringConstructorFunctionDsps, 
            StringConstructorFunctionWeight);
    }
}

export class RegExpBuilder extends BuiltinBuilder {
    constructor() {
        super("RegExp", false,
            RegExpPropertyDsps,
            RegExpPropertyWeight,
            RegExpFunctionDsps,
            RegExpFunctionWeight);
    }
}

export class RegExpCtorBuilder extends BuiltinBuilder {
    constructor() {
        super("RegExpCtor", true,
            RegExpConstructorPropertyDsps, 
            RegExpConstructorPropertyWeight,
            {}, []);
    }
}

export class ArrayBuilder extends BuiltinBuilder {
    constructor() {
        super("Array", false,
            ArrayPropertyDsps, 
            ArrayPropertyWeight,
            ArrayFunctionDsps, 
            ArrayFunctionWeight);
    }
}

export class ArrayCtorBuilder extends BuiltinBuilder {
    constructor() {
        super("ArrayCtor", true,
            ArrayConstructorPropertyDsps, 
            DateConstructorPropertyWeight,
            ArrayConstructorFunctionDsps, 
            ArrayConstructorFunctionWeight);
    }
}

export class TypedArrayBuilder extends BuiltinBuilder {
    constructor() {
        super("TypedArray", false,
            TypedArrayPropertyDsps, 
            TypedArrayProepertyWeight,
            TypedArrayFunctionDsps,
            TypedArrayFunctionWeight);
    }
}

export class TypedArrayCtorBuilder extends BuiltinBuilder {
    constructor() {
        super("TypedArrayCtor", true,
            TypedArrayConstructorPropertyDsps, 
            TypedArrayConstructorPropertyWeight,
            TypedArrayConstructorFunctionDsps,
            TypedArrayConstructorFunctionWeight);
    }
}

export class MapBuilder extends BuiltinBuilder {
    constructor() {
        super("Map", false,
            MapPropertyDsps, 
            MapPropertyWeight,
            MapFunctionDsps, 
            MapFunctionWeight);
    }
}

export class MapCtorBuilder extends BuiltinBuilder {
    constructor() {
        super("MapCtor", true,
            MapConstructorPropertyDsps, MapConstructorPropertyWeight,
            {}, []);
    }
}

export class SetBuilder extends BuiltinBuilder {
    constructor() {
        super("Set", false,
            SetPropertyDsps, SetPropertyWeight,
            SetFunctionDsps, SetFunctionWeight);
    }
}

export class SetCtorBuilder extends BuiltinBuilder {
    constructor() {
        super("SetCtor", true,
            SetConstructorPropertyDsps, SetConstructorPropertyWeight,
            {}, []);
    }
}

export class WeakMapBuilder extends BuiltinBuilder {
    constructor() {
        super("WeakMap", false,
            WeakMapPropertyDsps, WeakMapPropertyWeight,
            WeakMapFunctionDsps, WeakMapFunctionWeight);
    }
}

export class WeakMapCtorBuilder extends BuiltinBuilder {
    constructor() {
        super("WeakMapCtor", true,
            WeakMapConstructorPropertyDsps, WeakMapConstructorPropertyWeight,
            {}, []);
    }
}

export class WeakSetBuilder extends BuiltinBuilder {
    constructor() {
        super("WeakSet", false,
            WeakSetPropertyDsps, WeakSetPropertyWeight,
            WeakSetFunctionDsps, WeakSetFunctionWeight);
    }
}

export class WeakSetCtorBuilder extends BuiltinBuilder {
    constructor() {
        super("WeakSetCtor", true,
            WeakSetConstructorPropertyDsps, WeakSetConstructorPropertyWeight,
            {}, []);
    }
}

export class ArrayBufferBuilder extends BuiltinBuilder {
    constructor() {
        super("ArrayBuffer", false,
            ArrayBufferPropertyDsps, ArrayBufferPropertyWeight,
            ArrayBufferFunctionDsps, ArrayBufferFunctionWeight);
    }
}

export class ArrayBufferCtorBuilder extends BuiltinBuilder {
    constructor() {
        super("ArrayBufferCtor", true,
            ArrayBufferConstructorPropertyDsps, ArrayBufferConstructorPropertyWeight,
            ArrayBufferConstructorFunctionDsps, ArrayBufferConstructorFunctionWeight);
    }
}

export class DataViewBuilder extends BuiltinBuilder {
    constructor() {
        super("DataView", false,
            DataViewPropertyDsps, DataViewPropertyWeight,
            DataViewFunctionDsps, DataViewFunctionWeight);
    }
}

export class DataViewCtorBuilder extends BuiltinBuilder {
    constructor() {
        super("DataViewCtor", true,
            DataViewConstructorPropertyDsps, DataViewConstructorPropertyWeight,
            {}, []);
    }
}

export class FunctionBuilder extends BuiltinBuilder {
    constructor() {
        super("Function", false,
            FunctionPropertyDsps, FunctionPropertyWeight ,
            FunctionFunctionDsps, FunctionFunctionWeight);
    }
}

export class FunctionCtorBuilder extends BuiltinBuilder {
    constructor() {
        super("FunctionCtor", true,
            FunctionConstructorPropertyDsps, FunctionConstructorPropertyWeight,
            {}, []);
    }
}

export class ObjectBuilder extends BuiltinBuilder {
    constructor() {
        super("Object", false,
            ObjectPropertyDsps, ObjectPropertyWeight,
            ObjectFunctionDsps, ObjectFunctionWeight);
    }
}

export class ObjectCtorBuilder extends BuiltinBuilder {
    constructor() {
        super("ObjectCtor", true,
            ObjectConstructorPropertyDsps, ObjectConstructorPropertyWeight,
            ObjectConstructorFunctionDsps, ObjectConstructorFunctionWeight);
    }
}

export class IteratorBuilder extends BuiltinBuilder {
    constructor() {
        super("Iterator", false,
            {}, [],
            IteratorFunctionDsps, IteratorFunctionWeight);
    }
}