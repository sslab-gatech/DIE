import * as t from "@babel/types"
import { assert, Pair, dbglog, printf, DEBUG } from "./utils";

export type BuiltinConstructor = typeof spec.BuiltinConstructorNames[number];
export type BuiltinNonConstructor = typeof spec.BuiltinNonConstructorNames[number];
export type TypedArray = typeof spec.TypedArrayNames[number];

export type Dsps<T=spec.Dsp> = {[s:string]:T};
type oDsps = {["property"]?: Dsps, ["function"]?: Dsps<spec.FunctionDsp>, ['constp']?: Dsps, ["constf"]?: Dsps<spec.FunctionDsp>};
export type Shape = Array<Weight<Pair<string, Types>>>;

export type SerializedType = {['type']: string, ['extra']?: {[key: string]: any}};
export type SerializedTypes = Array<SerializedType>;

export abstract class BaseType {
    type: string;
    subType: string;
    dsp: oDsps; 
    constructor(itype: string) {
        this.type = itype;
        this.dsp = {};
    } 
    // handle subtype
    dsps() {
        if (!this.dsp.property) {
            this.dsp.property = spec.ObjectPropertyDsps
            if (spec[this.type + "PropertyDsps"]) {
                this.dsp.property = {...spec[this.type+ "PropertyDsps"], ...this.dsp.property};
            }
            if (this.subType && spec[ this.subType + "PropertyDsps"]) {
                this.dsp.property = {...spec[this.subType+ "PropertyDsps"], ...this.dsp.property};
            } 
        } 
        if (!this.dsp.function) {
            this.dsp.function = spec.ObjectFunctionDsps 
            if (spec[this.type + "FunctionDsps"]) {
                this.dsp.function = {...spec[this.type+ "FunctionDsps"], ...this.dsp.function};
            }
            if (this.subType && spec[ this.subType + "FunctionDsps"]) {
                this.dsp.function = {...spec[this.subType+ "FunctionDsps"], ...this.dsp.function};
            }
        }
        if (!this.dsp.constp) {
            if (spec[ this.type + "ConstructorPropertyDsps"]) {
                this.dsp.constp = spec[this.type+ "ConstructorPropertyDsps"];
            } else if (this instanceof ConstructorType) {
                this.dsp.constp = spec[this.name + "ConstructorPropertyDsps"]
            }
        } 
        if (!this.dsp.constf) {
            if(spec[this.type + "ConstructorFunctionDsps"]) {
                this.dsp.constf = spec[this.type+ "ConstructorFunctionDsps"];
            }
            else if (this instanceof ConstructorType) {
                this.dsp.constf = spec[this.name + "ConstructorFunctionDsps"]
            }
        }
        return this.dsp;
    }

    serialize(): SerializedType {
        return { type: this.type };
    }

    static deserialize(ST: SerializedType): Types {
        switch(ST.type) {
            case "Object":
                return ObjectType.deserialize(ST);
            case "Function":
                return FunctionType.deserialize(ST);
            case "FunctionExpression":
                return FunctionExpressionType.deserialize(ST);
            case "Array":
                return ArrayType.deserialize(ST);
            case "TypedArray":
                return TypedArrayType.deserialize(ST);
            case "Mixed":
                return MixedType.deserialize(ST);
            case "Args":
                return ArgsType.deserialize(ST);
            case "Constructor":
                return ConstructorType.deserialize(ST);
            case "PrototypeType":
                return PrototypeType.deserialize(ST);
            case "Custom":
                return CustomType.deserialize(ST);
            default:
                let type: Types = st[ST.type.toLowerCase() + "Type"];
                assert(!!type, "The singleton type does not exist?");
                return type;
        }
        return null; 
    }
};

//////////////////////////////////////////////
/* This is not JS types but need for type inference */

export class UnknownType extends BaseType {
    constructor() {
        super("Unknown");
    }

    serialize() : SerializedType {
        assert(false, "Serialize an unknown type.");
        return null;
    }
};

/* This also should have builder */
export class VoidType extends BaseType {
    constructor() {
        super("Void");
    }
};

export class AnyType extends BaseType {
    constructor() {
        super("Any");
    }
};

//////////////////////////////////////////////

export class InfinityType extends BaseType {
    constructor() {
        super("Infinity");
    }
};

export class NaNType extends BaseType {
    constructor() {
        super("NaN");
    }
};

export class UndefinedType extends BaseType {
    constructor() {
        super("Undefined");
    }
};

export class NullType extends BaseType {
    constructor() {
        super("Null");
    }
};

export class ObjectType extends BaseType {
    shape : Shape;
    keys : Set<string>;

    constructor(shape : Shape, subType : string = undefined) {
        super("Object");
        this.shape = shape;
        this.subType = subType;
        this.keys = new Set<string>();

        if (this.shape) {
            for (let kv of shape) {
                this.keys.add(kv.v.first);
            }
        }
    }

    serialize() : SerializedType {
        let ST: SerializedType = { type: "Object" };
        if (this.shape) {
            let shape: Array<Weight<[string, SerializedType]>> = [];
            for (let kv of this.shape) {
                let prop: string = kv.v.first;
                let valueT: Types = kv.v.second;
                if (valueT) {
                    shape.push({w: kv.w, v: [prop, valueT.serialize()]});
                } else if (DEBUG) {
                    throw new Error("The type of an object's property is not inferred.");
                }
            }
            ST.extra = {"shape": shape};
        } else {
            ST.extra = {"shape": null};
        }
        return ST;
    }

    static deserialize(ST: SerializedType): ObjectType {
        let sShape: Array<Weight<[string, SerializedType]>> = ST.extra.shape;
        if (sShape == null) {
            return st.objectType;
        } else {
            let shape: Shape;
            shape = [];
            for (let kv of sShape) {
                shape.push({w: kv.w, v: new Pair(kv.v[0], BaseType.deserialize(kv.v[1]))})
            }
            return new ObjectType(shape);
        }
    } 

    hasKey(s : string) : boolean {
        return this.keys.has(s);
    }

    addKey(s : string, t : Types, weight : number = 1) : void {
        if (!this.shape)
            this.shape = [];
        this.shape.push({w: weight, v: new Pair(s, t)});
        this.keys.add(s);
    }

};

export class FunctionType extends BaseType {
    retType: Types;
    argTypes: ArgsType; 

    constructor(argTypes : ArgsType = new ArgsType(), retType = new AnyType(), subType : string = undefined) {
        super("Function");
        this.subType = subType;
        this.retType = retType;
        this.argTypes = argTypes;
    }

    serialize(): SerializedType {
        let ST: SerializedType = { type: "Function" };
        let extra: {[key: string]: any} = {};
        extra.args = this.argTypes.serialize();
        extra.ret = this.retType.serialize();
        ST.extra = extra;
        return ST;
    }

    static deserialize(ST: SerializedType): FunctionType {
        let extra: {[key: string]: any} = ST.extra; 
        let argTypes: ArgsType = <ArgsType>BaseType.deserialize(extra.args);
        let retType: Types = BaseType.deserialize(extra.ret);
        return new FunctionType(argTypes, retType);
    }
};

export class FunctionExpressionType extends BaseType {
    retType : Types;
    argTypes : ArgsType;

    constructor(argTypes : ArgsType, retType : Types) {
        super("FunctionExpression");
        this.argTypes = argTypes;
        this.retType = retType;
    }

    serialize() : SerializedType {
        let ST : SerializedType = { type: "FunctionExpression" };
        let extra : {[key : string] : any} = {};
        extra["ret"] = this.retType.serialize();
        extra["args"] = this.argTypes.serialize();
        ST.extra = extra;
        return ST;
    }

    static deserialize(ST: SerializedType): FunctionExpressionType {
        let extra: {[key: string]: any} = ST.extra; 
        let argTypes: ArgsType = <ArgsType>BaseType.deserialize(extra.args);
        let retType: Types = BaseType.deserialize(extra.ret);
        return new FunctionType(argTypes, retType);
    }
}

export class BooleanType extends BaseType {
    constructor() {
        super("Boolean");
    }
};

export class SymbolType extends BaseType {
    constructor() {
        super("Symbol");
    }
};

export class ErrorType extends BaseType {
    constructor() {
        super("Error");
    }
};

export class NumberType extends BaseType {
    constructor() {
        super("Number");
    }
};

export class MathType extends BaseType {
    constructor() {
        super("Math");
    }
};

export class DateType extends BaseType {
    constructor() {
        super("Date");
    }
};

export class StringType extends BaseType {
    constructor() {
        super("String");
    }
};

export class RegExpType extends BaseType {
    constructor() {
        super("RegExp");
    }
};

export class ArrayType extends BaseType {
    elemType: Types;

    constructor(elemType : Types) {
        super("Array");
        this.elemType = elemType;
    }

    serialize(): SerializedType {
        let ST: SerializedType = { type: "Array" };
        let extra: {[key: string]: any} = {};
        extra.elemType = this.elemType.serialize();
        ST.extra = extra;
        return ST;
    }

    static deserialize(ST: SerializedType): ArrayType {
        let elemType: Types = BaseType.deserialize(<SerializedType>ST.extra.elemType);
        return new ArrayType(elemType);
    } 
};

export class TypedArrayType extends BaseType {
    constructor(subType : string = undefined) {
        super("TypedArray");
        this.subType = subType;
    }

    serialize() : SerializedType {
        let ST : SerializedType = { type: "TypedArray" };
        let extra : {[key : string] : any} = {};
        if (this.subType)
            extra.subType = this.subType;
        ST.extra = extra;
        return ST;
    }

    static deserialize(ST: SerializedType): TypedArrayType {
        let subType: string = ST.extra.subType;
        if (!subType)
            return st.typedarrayType;
        else
            return new TypedArrayType(subType);
    }
};

export class Int8ArrayType extends TypedArrayType {
    constructor() {
        super("Int8Array");
    }
};

export class Uint8ArrayType extends TypedArrayType {
    constructor() {
        super("Uint8Array");
    }
};

export class Uint8ClampedArrayType extends TypedArrayType {
    constructor() {
        super("Uint8ClampedArray");
    }
};

export class Int16ArrayType extends TypedArrayType {
    constructor() {
        super("Int16Array");
    }
};

export class Uint16ArrayType extends TypedArrayType {
    constructor() {
        super("Uint16Array");
    }
};

export class Int32ArrayType extends TypedArrayType {
    constructor() {
        super("Int32Array");
    }
};

export class Uint32ArrayType extends TypedArrayType {
    constructor() {
        super("Uint32Array");
    }
};

export class Float32ArrayType extends TypedArrayType {
    constructor() {
        super("Float32Array");
    }
};

export class Float64ArrayType extends TypedArrayType {
    constructor() {
        super("Float64Array");
    }
};

export class MapType extends BaseType {
    constructor() {
        super("Map");
    }
};

export class SetType extends BaseType {
    constructor() {
        super("Set");
    }
};

export class WeakMapType extends BaseType {
    constructor() {
        super("WeakMap");
    }
};

export class WeakSetType extends BaseType {
    constructor() {
        super("WeakSet");
    }
};

export class ArrayBufferType extends BaseType {
    constructor() {
        super("ArrayBuffer");
    }
};

export class SharedArrayBufferType extends BaseType {
    constructor() {
        super("SharedArrayBuffer");
    }
}

export class AtomicsType extends BaseType {
    constructor() {
        super("Atomics");
    }
};

export class DataViewType extends BaseType {
    constructor() {
        super("DataView");
    }
};

export class JSONType extends BaseType {
    constructor() {
        super("JSON");
    }
};

export class PromiseType extends BaseType {
    constructor() {
        super("Promise");
    }
};

export class GeneratorType extends BaseType {
    constructor() {
        super("Generator");
    }
};

export class GeneratorFunctionType extends BaseType {
    constructor() {
        super("GeneratorFunction");
    }
};

export class AsyncFunctionType extends BaseType {
    constructor() {
        super("AsyncFunction");
    }
};

export class ReflectType extends BaseType {
    constructor() {
        super("Reflect");
    }
};

export class ProxyType extends BaseType {
    constructor() {
        super("Proxy");
    }
};

export class IntlType extends BaseType {
    constructor() {
        super("Intl");
    }
};

/////////////////////////////////////////
//  Custom Types
/////////////////////////////////////////
export class MixedType extends BaseType {
    types : Array<Types>;

    constructor(types : Array<Types>) {
        super("Mixed");
        this.types = types;
    }
    dsps() : oDsps {
        let dsp : oDsps = {};
        for(let type of this.types) {
            // XXX: mixed type can have function type, 
            // which has already been set to undefined.
            if (type) {
                let d = type.dsps();
                dsp.property = {...dsp.property, ...d.property};
                dsp.function = {...dsp.function, ...d.function};
                dsp.constp = {...dsp.constp, ...d.constp};
                dsp.constf = {...dsp.constf, ...d.constf};
            }
        }
        return dsp;
    }

    serialize(): SerializedType {
        let ST: SerializedType = { type: "Mixed" };
        let extra: {[key: string]: any} = {};
        extra.subTypes = new Array(this.types.length);
        for (let i = 0; i < this.types.length; i++) {
            extra.subTypes[i] = this.types[i].serialize();
        }
        ST.extra = extra;
        return ST;
    }

    static deserialize(ST: SerializedType): MixedType {
        let types: Array<Types> = Array(); 
        for (let type of ST.extra.subTypes) {
            if(type)
                types.push(BaseType.deserialize(type));
        }
        return new MixedType(types);
    }
}

export class ImmutableType extends BaseType {
    constructor() {
        super("Immutable");
    }
}


/////////////////////////////////////////
// args type
/////////////////////////////////////////
export class ArgType extends BaseType {
    atype : Types;
    infinite : boolean;
    optional : boolean;

    constructor(type : Types, infinite: boolean = false, optional : boolean = false) {
        super("arg");
        this.atype = type;
        this.infinite = infinite;
        this.optional = optional;
    }

    serialize() : SerializedType {
        return this.atype.serialize();
    }

    static deserialize(ST: SerializedType): ArgType {
        return new ArgType(BaseType.deserialize(ST));
    }
}

export class ArgsType extends BaseType {
    args : ArgType[];
    constructor(args : ArgType[] = [new ArgType(new AnyType())]) {
        super("Args");
        this.args = args;
    }

    serialize(): SerializedType {
        let ST: SerializedType = { type: "Args" };
        let args: Array<SerializedType> = new Array(this.args.length);
        for (let i = 0; i < this.args.length; i++) {
            args[i] = <SerializedType>this.args[i].serialize(); 
        }
        ST.extra = { "args": args };
        return ST;
    }

    static deserialize(ST: SerializedType): ArgsType {
        let args: Array<ArgType> = (<Array<SerializedType>>(ST.extra.args)).map(ArgType.deserialize);
        return new ArgsType(args);
    }
}

/////////////////////////////////////////
// Constructor type
/////////////////////////////////////////
export class ConstructorType extends BaseType {
    name : string;
    ret : Types;
    constructor(name : string = undefined, ret : Types = undefined) {
        super("Constructor");
        this.name = name;
        this.ret = ret;
    }

    serialize() : SerializedType {
        let ST : SerializedType = { type: "Constructor" }; 
        let extra : {[key : string] : any} = {};
        if (this.name)
            extra.name = this.name;
        if (this.ret)
            extra.ret = this.ret.serialize();
        ST.extra = extra;
        return ST;
    }

    static deserialize(ST: SerializedType): ConstructorType {
        let name: string = ST.extra.name;
        let ret: Types = ST.extra.ret ? BaseType.deserialize(<SerializedType>ST.extra.ret) : undefined;
        return new ConstructorType(name, ret);
    }
}

export class PrototypeType extends BaseType {
    name: string;
    construct: Types;

    constructor(name: string = undefined, construct: Types = undefined) {
        super("Prototype");
        this.name = name;
        this.construct = construct;
    }

    dsps(): oDsps {
        return this.construct.dsps();
    }

    serialize(): SerializedType {
        let ST: SerializedType = { type: "Prototype" }; 
        let extra: {[key: string] : any} = {};
        if (this.name)
            extra.name = this.name;
        if (this.construct)
            extra.construct = this.construct.serialize();
        ST.extra = extra;
        return ST;
    }

    static deserialize(ST: SerializedType): PrototypeType {
        let name: string = ST.extra.name;
        let construct: Types = ST.extra.construct ? BaseType.deserialize(<SerializedType>ST.extra.construct) : undefined;
        return new PrototypeType(name, construct);
    }
}

/////////////////////////////////////////
// iterator type
/////////////////////////////////////////
export class IteratorType extends BaseType {
    constructor() {
        super("Iterator");
    }
}

/////////////////////////////////////////
// custom type (class?/function?)
/////////////////////////////////////////
export class CustomType extends BaseType {
    constructor(name : string) {
        super(name);
    }

    serialize() : SerializedType {
        return { type: "Custom",
                extra: { subType: this.type } }; 
    }

    static deserialize(ST: SerializedType): CustomType {
        return new CustomType(ST.extra.subType);
    }
}

export type CustomTypes = UnknownType | VoidType | MixedType | TypedArrayType | ConstructorType | PrototypeType | IteratorType | ArgsType ;
export type Types = CustomTypes | ArrayTypes | BasicTypes | CompTypes | CollectionTypes | StructuredTypes | ControlObjTypes | IntlType | ErrorType;
export type ArrayTypes = ArrayType | TypedArrayTypes;
export type TypedArrayTypes = Int8ArrayType | Uint8ArrayType | Uint8ClampedArrayType | Int16ArrayType | Uint16ArrayType | Int32ArrayType | Uint32ArrayType | Float32ArrayType | Float64ArrayType;
export type BasicTypes = InfinityType | NaNType | UndefinedType | NullType | ObjectType | FunctionType | BooleanType | SymbolType | NumberType | StringType;
export type CompTypes = MathType | DateType | RegExpType;
export type CollectionTypes = MapType | SetType | WeakMapType | WeakSetType;
export type StructuredTypes = ArrayBufferType | SharedArrayBufferType | AtomicsType | DataViewType | JSONType;
export type ControlObjTypes = PromiseType | GeneratorType | GeneratorFunctionType | AsyncFunctionType;
export type ReflectTypes = ReflectType | ProxyType;

class SingletonTypes {
    anyType : AnyType;

    infinityType: InfinityType;
    nanType: NaNType;
    undefinedType: UndefinedType;
    nullType: NullType;

    numberType: NumberType;
    booleanType: BooleanType;
    stringType: StringType;

    symbolType: SymbolType;
    mathType: MathType;
    dateType: DateType;
    regexpType: RegExpType;
    atomicsType: AtomicsType;
    jsonType: JSONType;
    promiseType: PromiseType;
    errorType: ErrorType;
    intlType: IntlType;

    arraybufferType: ArrayBufferType;
    sharedarraybufferType: SharedArrayBufferType;
    dataviewType: DataViewType;
    typedarrayType : TypedArrayType;
    
    int8arrayType: Int8ArrayType;
    uint8arrayType: Uint8ArrayType;
    uint8clampedarrayType: Uint8ClampedArrayType;
    int16arrayType: Int16ArrayType;
    uint16arrayType: Uint16ArrayType;
    int32arrayType: Int32ArrayType;
    uint32arrayType: Uint32ArrayType;
    float32arrayType: Float32ArrayType;
    float64arrayType: Float64ArrayType;

    mapType: MapType;
    setType: SetType;
    weakmapType: WeakMapType;
    weaksetType: WeakSetType;

    generatorType: GeneratorType;
    generatorfunctionType: GeneratorFunctionType;
    asyncfunctionType: AsyncFunctionType;

    reflectType: ReflectType;
    proxyType: ProxyType;

    unknownType: UnknownType;
    voidType : VoidType;

    objectType: ObjectType;
    arrayType : ArrayType;
    numberArrayType : ArrayType;
    stringArrayType : StringType;
    functionType : FunctionType;
    iteratorType : IteratorType;
    iterableType : MixedType;

    // constructor type
    constructorType : ConstructorType;
    constructorTypes: {[key in BuiltinConstructor]:ConstructorType};
    prototypeType : PrototypeType;
    prototypeTypes: {[key in BuiltinConstructor]:PrototypeType};

    argumentsType : ArrayType;
    argType : ArgType;
    propertyType : ObjectType;
    proxyhandlerType : ObjectType;
    immutableType: ImmutableType;

    isBuiltinConstructor(type : Types) : boolean {
        if (!(type instanceof ConstructorType))
            return false;
        return (<ConstructorType>type).name in this.constructorTypes;
    }

    constructor() {
        // This is only used during parsing.
        this.unknownType = new UnknownType();

        this.anyType = new AnyType();
        this.infinityType = new InfinityType();
        this.nanType = new NaNType();
        this.undefinedType = new UndefinedType();
        this.nullType = new NullType();
        this.numberType = new NumberType();
        this.booleanType = new BooleanType();
        this.stringType = new StringType();
        this.symbolType = new SymbolType();
        this.mathType = new MathType();
        this.dateType = new DateType();
        this.regexpType = new RegExpType();
        this.atomicsType = new AtomicsType();
        this.jsonType = new JSONType();
        this.promiseType = new PromiseType();
        this.errorType = new ErrorType();
        this.intlType = new IntlType();
        this.arraybufferType = new ArrayBufferType();
        this.sharedarraybufferType = new SharedArrayBufferType();
        this.dataviewType = new DataViewType();

        this.typedarrayType = new TypedArrayType();
        this.int8arrayType = new Int8ArrayType();
        this.uint8arrayType = new Uint8ArrayType();
        this.uint8clampedarrayType = new Uint8ClampedArrayType();
        this.int16arrayType = new Int16ArrayType();
        this.uint16arrayType = new Uint16ArrayType();
        this.int32arrayType = new Int32ArrayType();
        this.uint32arrayType = new Uint32ArrayType();
        this.float32arrayType = new Float32ArrayType();
        this.float64arrayType = new Float64ArrayType();

        this.mapType = new MapType();
        this.setType = new SetType();
        this.weakmapType = new WeakMapType();
        this.weaksetType = new WeakSetType();
        this.generatorType = new GeneratorType();
        this.generatorfunctionType = new GeneratorFunctionType();
        this.asyncfunctionType = new AsyncFunctionType();
        this.reflectType = new ReflectType();
        this.proxyType = new ProxyType();

        this.objectType = new ObjectType(null);
        this.arrayType = new ArrayType(this.anyType);
        this.numberArrayType = new ArrayType(this.numberType);
        this.stringArrayType= new ArrayType(this.stringType);
        this.functionType = new FunctionType();

        this.iteratorType = new IteratorType();
        this.iterableType = new MixedType([this.arrayType, this.stringType, this.typedarrayType, this.mapType, this.setType])

        this.argType = new ArgType(this.anyType, false, true);
        this.immutableType = new ImmutableType();

        // constructor type
        this.constructorType = new ConstructorType();
        this.constructorTypes  = <{[key in BuiltinConstructor]:ConstructorType}>new Object();
        this.constructorTypes.Number = new ConstructorType("Number", this.getType("Number"));
        this.constructorTypes.Date = new ConstructorType("Date", this.getType("Date"));
        this.constructorTypes.String = new ConstructorType("String", this.getType("String"));
        this.constructorTypes.RegExp = new ConstructorType("RegExp", this.getType("RegExp"));
        this.constructorTypes.Array = new ConstructorType("Array", this.getType("Array"));
        this.constructorTypes.TypedArray = new ConstructorType("TypedArray", this.getType("TypedArray"));
        this.constructorTypes.Map = new ConstructorType("Map", this.getType("Map"));
        this.constructorTypes.Set = new ConstructorType("Set", this.getType("Set"));
        this.constructorTypes.WeakMap = new ConstructorType("WeakMap", this.getType("WeakMap"));
        this.constructorTypes.WeakSet = new ConstructorType("WeakSet", this.getType("WeakSet"));
        this.constructorTypes.ArrayBuffer = new ConstructorType("ArrayBuffer", this.getType("ArrayBuffer"));
        // this.constructorTypes.SharedArrayBuffer = new ConstructorType("SharedArrayBuffer", this.getType("SharedArrayBuffer"));
        this.constructorTypes.DataView = new ConstructorType("DataView", this.getType("DataView"));
        this.constructorTypes.Function = new ConstructorType("Function", this.getType("Function"));
        this.constructorTypes.Object = new ConstructorType("Object", this.getType("Object"));
        this.constructorTypes.Boolean = new ConstructorType("Boolean", this.getType("Boolean"));
        this.constructorTypes.Error = new ConstructorType("Error", this.getType("Error"));
        this.constructorTypes.Promise = new ConstructorType("Promise", this.getType("Promise"));
        this.constructorTypes.Proxy = new ConstructorType("Proxy", this.getType("Proxy"));
        this.constructorTypes.Symbol = new ConstructorType("Symbol", this.getType("Symbol"));
        // this.constructorTypes.Atomics = new ConstructorType("Atomics", this.getType("Atomics"));


        // prototype type
        this.prototypeType = new PrototypeType();
        this.prototypeTypes = <{[key in BuiltinConstructor]:PrototypeType}>new Object();
        this.prototypeTypes.Number = new PrototypeType("Number", this.getType("Number"));
        this.prototypeTypes.Date = new PrototypeType("Date", this.getType("Date"));
        this.prototypeTypes.String = new PrototypeType("String", this.getType("String"));
        this.prototypeTypes.RegExp = new PrototypeType("RegExp", this.getType("RegExp"));
        this.prototypeTypes.Array = new PrototypeType("Array", this.getType("Array"));
        this.prototypeTypes.TypedArray = new PrototypeType("TypedArray", this.getType("TypedArray"));
        this.prototypeTypes.Map = new PrototypeType("Map", this.getType("Map"));
        this.prototypeTypes.Set = new PrototypeType("Set", this.getType("Set"));
        this.prototypeTypes.WeakMap = new PrototypeType("WeakMap", this.getType("WeakMap"));
        this.prototypeTypes.WeakSet = new PrototypeType("WeakSet", this.getType("WeakSet"));
        this.prototypeTypes.ArrayBuffer = new PrototypeType("ArrayBuffer", this.getType("ArrayBuffer"));
        // this.prototypeTypes.SharedArrayBuffer = new PrototypeType("SharedArrayBuffer", this.getType("SharedArrayBuffer"));
        this.prototypeTypes.DataView = new PrototypeType("DataView", this.getType("DataView"));
        this.prototypeTypes.Function = new PrototypeType("Function", this.getType("Function"));
        this.prototypeTypes.Object = new PrototypeType("Object", this.getType("Object"));
        this.prototypeTypes.Boolean = new PrototypeType("Boolean", this.getType("Boolean"));
        this.prototypeTypes.Error = new PrototypeType("Error", this.getType("Error"));
        this.prototypeTypes.Promise = new PrototypeType("Promise", this.getType("Promise"));
        this.prototypeTypes.Proxy = new PrototypeType("Proxy", this.getType("Proxy"));
        this.prototypeTypes.Symbol = new PrototypeType("Symbol", this.getType("Symbol"));
        // this.prototypeTypes.Atomics = new PrototypeType("Atomics", this.getType("Atomics"));

        this.voidType = new VoidType();
        this.argumentsType = new ArrayType(this.anyType);
        this.propertyType = new ObjectType([
            {w:1, v: new Pair("configurable",this.booleanType)}, 
            {w:1, v : new Pair("enumerable", this.booleanType)}, 
            {w:5, v:new Pair("value", this.anyType)}, 
            {w:1, v:new Pair("writable", this.booleanType)}, 
            {w:5, v: new Pair("get", new FunctionExpressionType(new ArgsType(), this.anyType))}, 
            {w:5, v:new Pair("set", new FunctionExpressionType(new ArgsType([new ArgType(this.anyType, false, false)]), this.undefinedType))}
        ]);
        this.proxyhandlerType = new ObjectType([
            {w:1, v: new Pair("getPrototypeOf", new FunctionExpressionType(new ArgsType([
                new ArgType(this.objectType)
            ]), this.objectType))}, 
            {w:1, v : new Pair("setPrototypeOf", new FunctionExpressionType(new ArgsType([
                new ArgType(this.objectType),
                new ArgType(this.objectType)
            ]), this.booleanType))}, 
            {w:1, v: new Pair("isExtensible", new FunctionExpressionType(new ArgsType([
                new ArgType(this.objectType)
            ]), this.booleanType))}, 
            {w:1, v: new Pair("preventExtensions", new FunctionExpressionType(new ArgsType([
                new ArgType(this.objectType)
            ]), this.booleanType))}, 
            {w:1, v: new Pair("getOwnPropertyDescriptor", new FunctionExpressionType(new ArgsType([
                new ArgType(this.objectType),
                new ArgType(new MixedType([
                    this.numberType, this.stringType, this.symbolType
                ]))
            ]), this.objectType))},
            {w:1, v: new Pair("defineProperty", new FunctionExpressionType(new ArgsType([
                new ArgType(this.objectType),
                new ArgType(new MixedType([
                    this.numberType, this.stringType, this.symbolType
                ])),
                new ArgType(this.propertyType, false, true),
            ]), this.booleanType))}, 
            {w:3, v: new Pair("has", new FunctionExpressionType(new ArgsType([
                new ArgType(this.objectType),
                new ArgType(new MixedType([
                    this.numberType, this.stringType, this.symbolType
                ])),
            ]), this.booleanType))}, 
            {w:3, v: new Pair("get", new FunctionExpressionType(new ArgsType([
                new ArgType(this.objectType),
                new ArgType(new MixedType([
                    this.numberType, this.stringType, this.symbolType
                ])),
                new ArgType(new MixedType([
                    this.objectType, this.proxyType
                ])),
            ]), this.anyType))}, 
            {w:3, v: new Pair("set", new FunctionExpressionType(new ArgsType([
                new ArgType(this.objectType),
                new ArgType(new MixedType([
                    this.numberType, this.stringType, this.symbolType
                ])),
                new ArgType(this.anyType),
                new ArgType(new MixedType([
                    this.objectType, this.proxyType
                ])),
            ]), this.booleanType))}, 
            {w:1, v: new Pair("deleteProperty", new FunctionExpressionType(new ArgsType([
                new ArgType(this.objectType),
                new ArgType(new MixedType([
                    this.numberType, this.stringType, this.symbolType
                ])),
            ]), this.booleanType))}, 
            {w:1, v: new Pair("ownKeys", new FunctionExpressionType(new ArgsType([
                new ArgType(this.objectType),
            ]), this.stringArrayType))}, 
            {w:2, v: new Pair("apply", new FunctionExpressionType(new ArgsType([
                new ArgType(this.objectType),
                new ArgType(this.objectType),
                new ArgType(this.arrayType),
            ]), this.anyType))}, 
            {w:2, v: new Pair("construct", new FunctionExpressionType(new ArgsType([
                new ArgType(this.objectType),
                new ArgType(this.arrayType),
                new ArgType(this.objectType, false, true),
            ]), this.objectType))}, 
        ]);
    }

    getArrayType(type : Types) {
        if (type === this.numberType)
            return this.numberArrayType;
        else if (type === this.stringType)
            return this.stringArrayType;
        else
            return this.arrayType;
    }

    getType(type: string) {
        switch (type) {
            case "object":
            case "Object":
                return this.objectType;
            case "infinity":
            case "Infinity":
                return this.infinityType;
            case "nan":
            case "NaN":
                return this.nanType;
            case "undefined":
                return this.undefinedType;
            case "null":
                return this.nullType;
            case "number":
            case "Number":
                return this.numberType;
            case "boolean":
            case "Boolean":
                return this.booleanType;
            case "string":
            case "String":
                return this.stringType;
            case "symbol":
            case "Symbol":
                return this.symbolType;
            case "math":
            case "Math":
                return this.mathType;
            case "date":
            case "Date":
                return this.dateType;
            case "regexp":
            case "RegExp":
                return this.regexpType;
            case "atomics":
            case "Atomics":
                return this.atomicsType;
            case "json":
            case "JSON":
                return this.jsonType;
            case "promise":
            case "Promise":
                return this.promiseType;
            case "error":
            case "Error":
                return this.errorType;
            case "intl":
            case "Intl":
                return this.intlType;
            case "arraybuffer":
            case "ArrayBuffer":
                return this.arraybufferType;
            case "sharedarraybuffer":
            case "SharedArrayBuffer":
                return this.sharedarraybufferType;
            case "dataview":
            case "DataView":
                return this.dataviewType;
            case "typedarray" :
            case "TypedArray" :
                return this.typedarrayType;
            case "int8array":
            case "Int8Array":
                return this.int8arrayType;
            case "uint8array":
            case "Uint8Array":
                return this.uint8arrayType;
            case "uint8clampedarray":
            case "Uint8ClampedArray":
                return this.uint8clampedarrayType;
            case "int16array":
            case "Int16Array":
                return this.int16arrayType;
            case "uint16array":
            case "Uint16Array":
                return this.uint16arrayType;
            case "int32array":
            case "Int32Array":
                return this.int32arrayType;
            case "uint32array":
            case "Uint32Array":
                return this.uint32arrayType;
            case "float32array":
            case "Float32Array":
                return this.float32arrayType;
            case "float64array":
            case "Float64Array":
                return this.float64arrayType;
            case "map":
            case "Map":
                return this.mapType;
            case "set":
            case "Set":
                return this.setType;
            case "weakmap":
            case "WeakMap":
                return this.weakmapType;
            case "weakset":
            case "WeakSet":
                return this.weaksetType;
            case "generator":
            case "Generator":
                return this.generatorType;
            case "generatorfunction":
            case "GeneratorFunction":
                return this.generatorfunctionType;
            case "asyncfunction":
            case "AsyncFunction":
                return this.asyncfunctionType;
            case "reflect":
            case "Reflect":
                return this.reflectType;
            case "proxy":
            case "Proxy":
                return this.proxyType;
            case "function":
            case "Function":
                return this.functionType;
            case "object":
            case "Object":
                return this.objectType;
            case "any (implicit)":
            case "any (explicit)":
            case "any":
            case "mixed":
                return this.unknownType;
            case "void":
                return this.voidType;
            case "array":
            case "Array":
                return this.arrayType;
            default:
                return null;
        }
    }

}

type TypeJson = {['type'] : string,['extra'] : {["shape"]? : [], ["elemType"]? : string, ["subTypes"]?}}
export function json2type(o : TypeJson) : Types {
    if (o.type == "object") {
        let shape : Weight<Pair<string, Types>>[] = [];
        for (let kv of o.extra.shape) {
            // XXX: typer: somehow an object's shape contains null.
            // e.g., array-bad-time.js
            if (kv) {
                shape.push({w:1, v:new Pair<string, Types>(kv[0], json2type(kv[1]))});
            }
        }
        return new ObjectType(shape);
    } else if (o.type == "array") {
        if (o.extra.elemType == "number") {
            return st.numberArrayType; 
        }
        else if (o.extra.elemType == "string") {
            return st.stringArrayType;
        }
        else if (o.extra.elemType == "any") {
            return st.arrayType;
        }
        else { 
            assert(false, "Invalid type: " + o.extra.elemType); 
        }
    } else if (o.type == "mixed") {
        let types : Types[] = [];
        for (let ty of o.extra.subTypes) {
            types.push(json2type(ty));
        }
        return new MixedType(types);
    // } 
    // XXX: temporarily use st.functionType 
    // for every function at this point.
    //else if (o.type == "function") {
    //    return undefined;
    //
    } else if (st[o.type + "Type"]) {
        return st[o.type + "Type"];
    } else {
        return new CustomType(o.type);
    }
}

export function isEqual(t1 : Types, t2 : Types) : boolean {
    if(!t1 && !t2) {
        return true;
    }
    else if(!t1 && t2 || !t2 && t1 ) {
        return false;
    }
    if(t1.type === t2.type) {

        if (t1 instanceof MixedType) {
            let tt2 : MixedType = t2 as MixedType;
            let ret = true
            if(t1.types.length != tt2.types.length)
                return false;
            for(let i = 0; i < t1.types.length; i++) {
                ret = ret && isEqual(t1.types[i], tt2.types[i]);
            }
            return ret;
        } else if (t1 instanceof ConstructorType) {
            let tt2 : ConstructorType = t2 as ConstructorType;
            if(t1.name == tt2.name)
                return true
        } else if (t1 instanceof PrototypeType) {
            let tt2 : PrototypeType = t2 as PrototypeType;
            if(t1.name == tt2.name)
                return true
        } else if (t1 instanceof ObjectType) {
            let tt2 : ObjectType = t2 as ObjectType;
            if(t1.keys === tt2.keys)
                return true
        } else if (t1 instanceof FunctionType) {
            let tt2 : FunctionType = t2 as FunctionType;
            if(isEqual(t1.retType, tt2.retType) && isEqual(t1.argTypes, tt2.argTypes)) {
                if(t1.subType == t2.subType) {
                    return true;
                }
            }
        } else if (t1 instanceof ArrayType) {
            let tt2 : ArrayType = t2 as ArrayType;
            if(isEqual(t1.elemType, tt2.elemType))
                return true
        } else if (t1 instanceof ArgType) {
            let tt2 : ArgType = t2 as ArgType;
            return isEqual(t1.atype, tt2.atype)
        } else if (t1 instanceof ArgsType) {
            let ret = true
            let tt2 : ArgsType = t2 as ArgsType;
            if(t1.args.length != tt2.args.length) return false;
            for(let i = 0; i < t1.args.length; i++) {
                ret = ret && isEqual(t1.args[i], tt2.args[i]);
            }
            return ret;
        }
        else if(t1.subType === t2.subType) {
            return true;
        }
    }
    return false;
}

export function isMatch(have : Types, want : Types, objectLike : boolean) : boolean {

    // What we have and what we want have the exactly same type object,
    // bingo!
    if (have === want)
        return true;

    // If we have VoidType, directly return false!
    if (have instanceof VoidType)
        return false;

    // If we have AnyType, we can build any wanted type.
    if (want instanceof AnyType || have instanceof AnyType)
        return true;

    // If we have MixedType, we need to check one by one.
    if (have instanceof MixedType) {
        for (let subType of have.types) {
            if (this.isMatch(subType, want))
                return true;
        }
        return false;
    }

    // If we want MixedType, 
    // we check what we have can satisfy any of the mixed type.
    if (want instanceof MixedType) {
        for (let subType of want.types) {
            if (this.isMatch(have, subType))
                return true;
        }
        return false;
    }
    
    if (want instanceof ArrayType) { 

        // If we want ArrayType, then we first make sure
        // what we have is ArrayType,
        // and their elemTypes match.
        if (!(have instanceof ArrayType)) return false;
        return this.isMatch(have.elemType, want.elemType, false);

    } else if (want instanceof ConstructorType) {

        if (!(have instanceof ConstructorType)) return false;
        if (!want.ret) return true;
        return have.name == want.name;

    } else if (want instanceof PrototypeType) {

        if (!(have instanceof PrototypeType)) return false;
        if (!want.construct) return true;
        return have.name == want.name;

    } else if (want instanceof FunctionType) {

        // If we want FunctionType, then simply see 
        // if what we have has FunctionType.
        return have instanceof FunctionType;

    } else if (want instanceof TypedArrayType) {

        // If we want FunctionType, then simply see 
        // if what we have has FunctionType.
        return have instanceof TypedArrayType;

    } else if (want instanceof ObjectType) {

        // If we want ObjectType, then simply see 
        // if what we have has ObjectType.
        if (objectLike)
            return have instanceof ObjectType
                || have instanceof ArrayType
                || have instanceof TypedArrayType
                || have instanceof MapType
                || have instanceof SetType
                || have instanceof PrototypeType
                || have instanceof ConstructorType;
        else
            return have instanceof ObjectType;
    }

    return false;
}

// For all other types, we only need to 
// generate something which has the exact type.
// These types are kinda larger types.
export function isNonPrimitiveType(type : Types) {
    return type === st.anyType
        || type === st.typedarrayType
        || type === st.constructorType
        || type === st.prototypeType
        || (type instanceof ObjectType)
        || (type instanceof ArrayType);
}

export function getCompatibleBaseTypes(type : Types, objectLike : boolean) : Array<Types> {
    if (type instanceof ObjectType) {
        if (objectLike)
            return [st.objectType, 
                    st.arrayType, 
                    st.typedarrayType, 
                    st.mapType, 
                    st.setType, 
                    st.prototypeType,
                    st.constructorType];
        else
            return [st.objectType];
    } else if (type instanceof TypedArrayType) {
        return [st.typedarrayType];
    } else if (type instanceof FunctionType) {
        return [st.functionType];
    } else if (type instanceof ArrayType) {
        return [st.arrayType];
    } else if (type instanceof PrototypeType) {
        return [st.prototypeType];
    } else if (type instanceof ConstructorType) {
        return [st.constructorType];
    } else if (type instanceof MixedType) {
        let types : Array<Types> = [];
        for (let t of type.types) {
            types = types.concat(getCompatibleBaseTypes(t, objectLike));
        }
        return types;
    } else {
        return [type];
    }
}

export const TypedArrayNames = [
    "Int8Array",
    "Uint8Array",
    "Uint8ClampedArray",
    "Int16Array",
    "Uint16Array",
    "Int32Array",
    "Uint32Array",
    "Float32Array",
    "Float64Array",
    // BigInt64Array
    // BigUint64Array
];

export const st = new SingletonTypes();

import * as spec from "./esspecs";
import { Weight } from "./esweight";
import { inspect } from "util";
