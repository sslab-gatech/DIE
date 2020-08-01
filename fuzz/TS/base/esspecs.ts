import * as t from "@babel/types";
import { TSNode } from "./esparse";
import { Pair, tuple } from "./utils";
import { Types, ArgsType, MixedType, ArgType, ObjectType, ArrayType, st, FunctionType, FunctionExpressionType} from "./estypes";

export const BuiltinConstructorNames = tuple(
    "Array",
    "ArrayBuffer",
    // XXX: these two are depreciated now so we ignore
    // "Atomics",
    // "SharedArrayBuffer",
    "Boolean", 
    "DataView",
    "Date",
    "Error", 
    "String",    
    "Map",
    "Number",
    "Object",
    "Promise", 
    "Proxy", 
    "RegExp",
    "Set",
    "Symbol", 
    "WeakMap",
    "WeakSet",
    "Function",
    "TypedArray",
);

export const BuiltinNonConstructorNames = tuple(
    "Math",
    "Reflect"
)

export const TypedArrayNames = tuple(
    "Int8Array",
    "Uint8Array",
    "Uint8ClampedArray",
    "Int16Array",
    "Uint16Array",
    "Int32Array",
    "Uint32Array",
    "Float32Array",
    "Float64Array",
);
// **************************************************************************************
//
// Interface 
//
// **************************************************************************************

export interface Dsp {
    type: Types;
    args: ArgsType;
    infer: (node?: t.Node) => Types;
}

// **************************************************************************************
//
// Variable Specification
//
// **************************************************************************************
export class VariableDsp implements Dsp {
    species: string;
    type: Types;
    args: ArgsType = null;

    constructor(species: string, type: Types) {
        this.species = species;
        this.type = type;
    }

    infer() : Types {
        return this.type;
    }
}

export const VariableDsps = {
    "var": new VariableDsp("var", st.anyType),
};

// **************************************************************************************
//
// Literal Specification
//
// **************************************************************************************
export class LiteralDsp implements Dsp {
    species: string;
    type: Types;
    args: ArgsType = null;

    constructor(species: string, type: Types) {
        this.species = species;
        this.type = type;
    }

    infer() : Types {
        return this.type;
    }
};

export const LiteralDsps = {
    "Boolean"   : new LiteralDsp("Boolean", st.booleanType),
    "String"    : new LiteralDsp("String", st.stringType),
    "Number"    : new LiteralDsp("Number", st.numberType),
    "Null"      : new LiteralDsp("Null", st.nullType),
    "RegExp"    : new LiteralDsp("RegExp", st.regexpType),
    "Math"      : new LiteralDsp("Math", st.mathType),
    "BuiltinConstructor": new LiteralDsp("BuiltinConstructor", st.constructorType),
};


// Expression
// **************************************************************************************
//
// Binary Expression Specification
//
// **************************************************************************************
export class BinaryExpressionDsp implements Dsp {
    operator : string;
    left : Types;
    right : Types;
    type : Types;
    args : ArgsType;

    constructor(operator : string, left : Types, right : Types, type : Types) {
        this.operator = operator;
        this.left = left;
        this.right = right;
        this.type = type;
        this.args = new ArgsType([new ArgType(left), new ArgType(right)]);
    }

    private inferPlus(node: t.BinaryExpression): Types {
        let left: TSNode = <TSNode>node.left;
        let right: TSNode = <TSNode>node.left;
        if (left.itype === st.stringType || right.itype === st.stringType)
            return st.stringType;
        else if (left.itype === st.numberType && right.itype === st.numberType)
            return st.numberType;
        else
            return this.type;
    }

    public infer(node: t.BinaryExpression): Types {
        if (node.operator == "+")
            return this.inferPlus(node);
        else
            return this.type;
    }
}

export const BinaryExpressionDsps = {
    "+": new BinaryExpressionDsp("+", 
        new MixedType([st.numberType, st.stringType]),
        new MixedType([st.numberType, st.stringType]),
        new MixedType([st.numberType, st.stringType])),
    "-": new BinaryExpressionDsp("-", st.numberType, st.numberType, st.numberType),
    "/": new BinaryExpressionDsp("/", st.numberType, st.numberType, st.numberType),
    "%": new BinaryExpressionDsp("%", st.numberType, st.numberType, st.numberType),
    "*": new BinaryExpressionDsp("*", st.numberType, st.numberType, st.numberType),
    "**": new BinaryExpressionDsp("**", st.numberType, st.numberType, st.numberType),
    "&": new BinaryExpressionDsp("&", st.numberType, st.numberType, st.numberType),
    "|": new BinaryExpressionDsp("|", st.numberType, st.numberType, st.numberType),
    ">>": new BinaryExpressionDsp(">>", st.numberType, st.numberType, st.numberType),
    ">>>": new BinaryExpressionDsp(">>>", st.numberType, st.numberType, st.numberType),
    "<<": new BinaryExpressionDsp("<<", st.numberType, st.numberType, st.numberType),
    "^": new BinaryExpressionDsp("^", st.numberType, st.numberType, st.numberType),
    //
    "==": new BinaryExpressionDsp("==", st.anyType, st.anyType, st.booleanType),
    "===": new BinaryExpressionDsp("===", st.anyType, st.anyType, st.booleanType),
    "!=": new BinaryExpressionDsp("!=", st.anyType, st.anyType, st.booleanType),
    "!==": new BinaryExpressionDsp("!==", st.anyType, st.anyType, st.booleanType),
    ">=": new BinaryExpressionDsp(">=", st.anyType, st.anyType, st.booleanType),
    "<=": new BinaryExpressionDsp("<=", st.anyType, st.anyType, st.booleanType),
    ">": new BinaryExpressionDsp(">", st.anyType, st.anyType, st.booleanType),
    "<": new BinaryExpressionDsp("<", st.anyType, st.anyType, st.booleanType),
    //
    "in": new BinaryExpressionDsp("in", st.stringType, st.objectType, st.booleanType),
    "instanceof": new BinaryExpressionDsp("instanceof", st.objectType, st.constructorType, st.booleanType),
}; 

// **************************************************************************************
//
// Uary Expression Specification
//
// **************************************************************************************
export class LogicalExpressionDsp implements Dsp {
    operator : string;
    left : Types;
    right : Types;
    type : Types;
    args : ArgsType;

    constructor(operator : string, left : Types, right : Types, type : Types) {
        this.operator = operator;
        this.left = left;
        this.right = right;
        this.type = type;
        this.args = new ArgsType([new ArgType(left), new ArgType(right)]);
    }

    infer() : Types {
        return this.type;
    }
}

export const LogicalExpressionDsps = {
    // it should be left type or right type.. (mixed type?)
    "&&": new LogicalExpressionDsp("&&", st.anyType, st.anyType, st.booleanType),
    "||": new LogicalExpressionDsp("||", st.anyType, st.anyType, st.booleanType),
};

// **************************************************************************************
//
// Uary Expression Specification
//
// **************************************************************************************
export class UnaryExpressionDsp implements Dsp {
    operator : string;
    argument : Types;
    prefix : boolean;
    type : Types;
    args : ArgsType;

    constructor(operator : string, argument : Types, prefix : boolean, type : Types) {
        this.operator = operator;
        this.argument = argument;
        this.prefix = prefix;
        this.type = type;
        this.args = new ArgsType([new ArgType(argument)]);
    }

    infer() : Types {
        return this.type;
    }
}

export const UnaryExpressionDsps = {
    "void": new UnaryExpressionDsp("void", st.anyType, true, st.undefinedType),
    "delete": new UnaryExpressionDsp("delete", st.anyType, true, st.booleanType),
    "throw": new UnaryExpressionDsp("throw", st.anyType, true, st.undefinedType),
    "!": new UnaryExpressionDsp("!", st.booleanType, true, st.booleanType),
    "+": new UnaryExpressionDsp("+", st.numberType, true, st.numberType), // note +[one element array] is also legit
    "-": new UnaryExpressionDsp("-", st.numberType, true, st.numberType),
    "~": new UnaryExpressionDsp("~", st.numberType, true, st.numberType),
    "typeof": new UnaryExpressionDsp("typeof", st.anyType, true, st.stringType),
};

// **************************************************************************************
//
// Update Expression Specification
//
// **************************************************************************************
export class UpdateExpressionDsp implements Dsp {
    operator : string;
    argument : Types;
    prefix : boolean;
    type : Types;
    args  : ArgsType;

    constructor(operator : string, argument : Types, prefix : boolean, type : Types) {
        this.operator = operator;
        this.argument = argument;
        this.prefix = prefix;
        this.type = type;
        this.args = new ArgsType([new ArgType(argument)]);
    }

    infer() : Types {
        return this.type;
    }
   
    // ++/-- cannot be used on Literals
}

export const UpdateExpressionDsps = {
    "++": new UpdateExpressionDsp("++", st.numberType, null, st.numberType),
    "--": new UpdateExpressionDsp("--", st.numberType, null, st.numberType),
}

// **************************************************************************************
//
// New Expression Specification
//
// **************************************************************************************
export class NewExpressionDsp implements Dsp {
    callee : string;
    arguments : ArgsType | MixedType;
    type : Types;
    args : ArgsType = null;
   
    constructor(callee : string, _arguments : ArgsType | MixedType, type : Types,
            infer : () => Types = null) {
        this.callee = callee;
        this.arguments = _arguments;
        this.type = type;
    }

    infer() : Types {
        return this.type;
    }
}

export const NewExpressionDsps = {
    "Array" : new NewExpressionDsp("Array", 
            new MixedType([
                new ArgsType([new ArgType(st.numberType)]),
                new ArgsType([new ArgType(st.anyType, true, false)]),
            ]), st.arrayType),
    "ArrayBuffer": new NewExpressionDsp("ArrayBuffer", 
            new ArgsType([new ArgType(st.numberType)]), st.arraybufferType),
    "SharedArrayBuffer": new NewExpressionDsp("SharedArrayBuffer", 
            new ArgsType([new ArgType(st.numberType)]), st.sharedarraybufferType),
    "Boolean": new NewExpressionDsp("Boolean", 
            new ArgsType([new ArgType(st.booleanType)]), st.booleanType),
    "DataView": new NewExpressionDsp("DataView",
            new ArgsType([
                new ArgType(st.arraybufferType), 
                new ArgType(st.numberType, false, true),
                new ArgType(st.numberType, false, true)]), st.dataviewType),
    "Date": new NewExpressionDsp("Date",
            new MixedType([
                new ArgsType([]),
                new ArgsType([new ArgType(st.stringType)]),
                new ArgsType([new ArgType(st.numberType), new ArgType(st.numberType), new ArgType(st.numberType, false, true), new ArgType(st.numberType, false, true), new ArgType(st.numberType, false, true), new ArgType(st.numberType, false, true), new ArgType(st.numberType, false, true)]),
            ]), st.dateType),
    "Error": new NewExpressionDsp("Error",
            new ArgsType([
                new ArgType(st.stringType),
                new ArgType(st.stringType, false, true),
                new ArgType(st.stringType, false, true),
            ]), st.errorType),
    "Int8Array": new NewExpressionDsp("Int8Array",
            new MixedType([
                new ArgsType([new ArgType(st.numberType)]), 
                new ArgsType([new ArgType(st.typedarrayType)]),
                new ArgsType([new ArgType(st.numberArrayType)]),
                new ArgsType([new ArgType(st.arraybufferType), new ArgType(st.numberType, false, true), new ArgType(st.numberType, false, true)]),
            ]), st.int8arrayType),
    "Uint8Array": new NewExpressionDsp("Uint8Array",
            new MixedType([
                new ArgsType([new ArgType(st.numberType)]), 
                new ArgsType([new ArgType(st.typedarrayType)]),
                new ArgsType([new ArgType(st.numberArrayType)]),
                new ArgsType([new ArgType(st.arraybufferType), new ArgType(st.numberType, false, true), new ArgType(st.numberType, false, true)]),
            ]), st.uint8arrayType),
    "Uint8ClampedArray": new NewExpressionDsp("Uint8ClampedArray",
            new MixedType([
                new ArgsType([new ArgType(st.numberType)]), 
                new ArgsType([new ArgType(st.typedarrayType)]),
                new ArgsType([new ArgType(st.numberArrayType)]),
                new ArgsType([new ArgType(st.arraybufferType), new ArgType(st.numberType, false, true), new ArgType(st.numberType, false, true)]),
            ]), st.uint8clampedarrayType),
    "Int16Array": new NewExpressionDsp("Int16Array",
            new MixedType([
                new ArgsType([new ArgType(st.numberType)]), 
                new ArgsType([new ArgType(st.typedarrayType)]),
                new ArgsType([new ArgType(st.numberArrayType)]),
                new ArgsType([new ArgType(st.arraybufferType), new ArgType(st.numberType, false, true), new ArgType(st.numberType, false, true)]),
            ]), st.int16arrayType),
    "Uint16Array": new NewExpressionDsp("Uint16Array",
            new MixedType([
                new ArgsType([new ArgType(st.numberType)]), 
                new ArgsType([new ArgType(st.typedarrayType)]),
                new ArgsType([new ArgType(st.numberArrayType)]),
                new ArgsType([new ArgType(st.arraybufferType), new ArgType(st.numberType, false, true), new ArgType(st.numberType, false, true)]),
            ]), st.uint16arrayType),
    "Int32Array": new NewExpressionDsp("Int32Array",
            new MixedType([
                new ArgsType([new ArgType(st.numberType)]), 
                new ArgsType([new ArgType(st.typedarrayType)]),
                new ArgsType([new ArgType(st.numberArrayType)]),
                new ArgsType([new ArgType(st.arraybufferType), new ArgType(st.numberType, false, true), new ArgType(st.numberType, false, true)]),
            ]), st.int32arrayType),
    "Uint32Array": new NewExpressionDsp("Uint32Array",
            new MixedType([
                new ArgsType([new ArgType(st.numberType)]), 
                new ArgsType([new ArgType(st.typedarrayType)]),
                new ArgsType([new ArgType(st.numberArrayType)]),
                new ArgsType([new ArgType(st.arraybufferType), new ArgType(st.numberType, false, true), new ArgType(st.numberType, false, true)]),
            ]), st.uint32arrayType),
    "Float32Array": new NewExpressionDsp("Float32Array",
            new MixedType([
                new ArgsType([new ArgType(st.numberType)]), 
                new ArgsType([new ArgType(st.typedarrayType)]),
                new ArgsType([new ArgType(st.numberArrayType)]),
                new ArgsType([new ArgType(st.arraybufferType), new ArgType(st.numberType, false, true), new ArgType(st.numberType, false, true)]),
            ]), st.float32arrayType),
    "Float64Array": new NewExpressionDsp("Float64Array",
            new MixedType([
                new ArgsType([new ArgType(st.numberType)]), 
                new ArgsType([new ArgType(st.typedarrayType)]),
                new ArgsType([new ArgType(st.numberArrayType)]),
                new ArgsType([new ArgType(st.arraybufferType), new ArgType(st.numberType, false, true), new ArgType(st.numberType, false, true)]),
            ]), st.float64arrayType),
    "Map": new NewExpressionDsp("Map", new ArgsType([new ArgType(st.iterableType, false, true)]), st.mapType),
    "Number": new NewExpressionDsp("Number", new ArgsType([new ArgType(st.numberType)]), st.numberType),
    "Object": new NewExpressionDsp("Object", new ArgsType([new ArgType(st.objectType)]), st.objectType),
    "Promise": new NewExpressionDsp("Promise", new ArgsType([new ArgType(st.functionType)]), st.promiseType),
    "Proxy": new NewExpressionDsp("Proxy", 
            new ArgsType([
                new ArgType(st.objectType), 
                new ArgType(st.proxyhandlerType)
            ]), st.proxyType),
    "RegExp": new NewExpressionDsp("RegExp", 
            new ArgsType([new ArgType(st.regexpType), new ArgType(st.stringType)]), st.regexpType),
    "Set": new NewExpressionDsp("Map", new ArgsType([new ArgType(st.iterableType, false, true)]), st.setType),
    "Function" : new NewExpressionDsp("Function", new ArgsType([]), st.functionType),
    "Symbol": new NewExpressionDsp("Symbol", 
            new MixedType([
                new ArgsType([]),
                new ArgsType([new ArgType(st.symbolType)]),
            ]), st.symbolType),
    "WeakMap": new NewExpressionDsp("WeakMap", new ArgsType([new ArgType(st.iterableType, false, true)]), st.weakmapType),
    "WeakSet": new NewExpressionDsp("WeakSet", new ArgsType([new ArgType(st.iterableType, false, true)]), st.weaksetType),
}

// **************************************************************************************
//
// Member Expression Specification
//
// **************************************************************************************
export class MemberExpressionDsp implements Dsp {
    species : string; 
    object : Types;
    type : Types;
    args : ArgsType = null;

    constructor(species, object, type) {
        this.species = species;
        this.object = object;
        this.type = type;
    }

    infer() : Types {
        return this.type;
    }
}

export const MemberExpressionDsps = {
    "array": new MemberExpressionDsp("array", st.arrayType, st.anyType),
    "typedarray": new MemberExpressionDsp("typedarray", st.typedarrayType, st.numberType),
    "object": new MemberExpressionDsp("object", st.objectType, st.anyType),
};

// **************************************************************************************
//
// Array Expression Specification
//
// **************************************************************************************
export class ArrayExpressionDsp implements Dsp {
    operator : string;
    type : Types;
    args : ArgsType = null;

    constructor(operator: string, type: Types) {
        this.operator = operator;
        this.type = type;
    }

    infer() : Types {
        return this.type;
    }
}

export const ArrayExpressionDsps = {
    "Any":      new ArrayExpressionDsp("Any", st.arrayType),
    "Number":   new ArrayExpressionDsp("Number", st.numberArrayType),
}

// **************************************************************************************
//
// Object Expression Specification
//
// **************************************************************************************
export class ObjectExpressionDsp implements Dsp {
    operator : string;
    type : Types;
    args : ArgsType = null;

    constructor(operator: string, type: Types) {
        this.operator = operator;
        this.type = type;
    }

    infer() : Types {
        return this.type;
    }
}

export const ObjectExpressionDsps = {
    "valueOf": new ObjectExpressionDsp("valueOf", st.numberType),
    "toString": new ObjectExpressionDsp("toString", st.stringType),
}

// BUILTIN Specification
// **************************************************************************************
//
// Property Specification
//
// **************************************************************************************
export class PropertyDsp implements Dsp {
    object: Types;
    property: string;
    type: Types;
    args: ArgsType;
   
    constructor(object: Types, property: string, type: Types) {
        this.object = object;
        this.property = property;
        this.type = type;
        this.args = new ArgsType([new ArgType(object)]);
    }

    infer() : Types {
        return this.type;
    }
};

export class FunctionDsp implements Dsp {
    object : Types;
    method : string;
    args : ArgsType;
    type : Types;

    constructor(object : Types, method : string, args : ArgsType, type : Types) {
        this.object = object;
        this.method = method;
        this.args = args;
        this.type = type;
    }

    infer() : Types {
        return this.type;
    }
};

// **************************************************************************************
//
// Number Specification
//
// **************************************************************************************
export const NumberConstructorPropertyDsps = {
    "prototype":        new PropertyDsp(st.constructorTypes.Number, "prototype", st.prototypeTypes.Number),
    "EPSILON":          new PropertyDsp(st.constructorTypes.Number, "EPSILON", st.numberType),
    "MAX_SAFE_INTEGER": new PropertyDsp(st.constructorTypes.Number, "MAX_SAFE_INTEGER", st.numberType),
    "MAX_VALUE":        new PropertyDsp(st.constructorTypes.Number, "MAX_VALUE", st.numberType),
    "MIN_SAFE_INTEGER": new PropertyDsp(st.constructorTypes.Number, "MIN_SAFE_INTEGER", st.numberType),
    "MIN_VALUE":        new PropertyDsp(st.constructorTypes.Number, "MIN_VALUE", st.numberType),
    "NaN":              new PropertyDsp(st.constructorTypes.Number, "NaN", st.numberType),
    "NEGATIVE_INFINITY":new PropertyDsp(st.constructorTypes.Number, "NEGATIVE_INFINITY", st.numberType),
    "POSITIVE_INFINITY":new PropertyDsp(st.constructorTypes.Number, "POSITIVE_INFINITY", st.numberType),
};

export const NumberConstructorFunctionDsps = {
    "isNaN":        new FunctionDsp(st.constructorTypes.Number, "isNaN", new ArgsType([new ArgType(st.numberType)]), st.booleanType),
    "isFinite":     new FunctionDsp(st.constructorTypes.Number, "isFinite", new ArgsType([new ArgType(st.numberType)]), st.booleanType),
    "isInteger":    new FunctionDsp(st.constructorTypes.Number, "isInteger", new ArgsType([new ArgType(st.numberType)]), st.booleanType),
    "isSafeInteger":new FunctionDsp(st.constructorTypes.Number, "isSafeInteger", new ArgsType([new ArgType(st.numberType)]), st.booleanType),
    "parseFloat":   new FunctionDsp(st.constructorTypes.Number, "parseFloat", new ArgsType([new ArgType(st.stringType)]), st.numberType),
    "parseInt":     new FunctionDsp(st.constructorTypes.Number, "parseInt", new ArgsType([new ArgType(st.stringType)]), st.numberType),
}

export const NumberFunctionDsps = {
    "toExponential": new FunctionDsp(st.numberType, "toExponential", new ArgsType([]), st.stringType),
    "toFixed":       new FunctionDsp(st.numberType, "toFixed", new ArgsType([]), st.stringType),
    "toLocaleString":new FunctionDsp(st.numberType, "toLocaleString", new ArgsType([]), st.stringType),
    "toPrecision":   new FunctionDsp(st.numberType, "toPrecision", new ArgsType([]), st.stringType),
    "toString":      new FunctionDsp(st.numberType, "toString", new ArgsType([]), st.stringType),
    "valueOf":       new FunctionDsp(st.numberType, "valueOf", new ArgsType([]), st.numberType),
}

// **************************************************************************************
//
// Math Specification
//
// **************************************************************************************
export const MathPropertyDsps = {
    "E":        new PropertyDsp(st.mathType, "E", st.numberType),
    "LN2":      new PropertyDsp(st.mathType, "LN2", st.numberType),
    "LN10":     new PropertyDsp(st.mathType, "LN10", st.numberType),
    "LOG2E":    new PropertyDsp(st.mathType, "LOG2E", st.numberType),
    "LOG10E":   new PropertyDsp(st.mathType, "LOG10E", st.numberType),
    "PI":       new PropertyDsp(st.mathType, "PI", st.numberType),
    "SQRT1_2":  new PropertyDsp(st.mathType, "SQRT1_2", st.numberType),
    "SQRT2":    new PropertyDsp(st.mathType, "SQRT2", st.numberType),
};

export const MathFunctionDsps = {
    "abs":      new FunctionDsp(st.mathType, "abs", new ArgsType([new ArgType(st.numberType)]), st.numberType),
    "acos":     new FunctionDsp(st.mathType, "acos", new ArgsType([new ArgType(st.numberType)]), st.numberType),
    "acosh":    new FunctionDsp(st.mathType, "acosh", new ArgsType([new ArgType(st.numberType)]), st.numberType),
    "asin":     new FunctionDsp(st.mathType, "asin", new ArgsType([new ArgType(st.numberType)]), st.numberType),
    "asinh":    new FunctionDsp(st.mathType, "asinh", new ArgsType([new ArgType(st.numberType)]), st.numberType),
    "atan":     new FunctionDsp(st.mathType, "atan", new ArgsType([new ArgType(st.numberType)]), st.numberType),
    "atanh":    new FunctionDsp(st.mathType, "atanh", new ArgsType([new ArgType(st.numberType)]), st.numberType),
    "atan2":    new FunctionDsp(st.mathType, "atan2", new ArgsType([new ArgType(st.numberType), new ArgType(st.numberType)]), st.numberType),
    "cbrt":     new FunctionDsp(st.mathType, "cbrt", new ArgsType([new ArgType(st.numberType)]), st.numberType),
    "ceil":     new FunctionDsp(st.mathType, "ceil", new ArgsType([new ArgType(st.numberType)]), st.numberType),
    "clz32":    new FunctionDsp(st.mathType, "clz32", new ArgsType([new ArgType(st.numberType)]), st.numberType),
    "cos":      new FunctionDsp(st.mathType, "cos", new ArgsType([new ArgType(st.numberType)]), st.numberType),
    "cosh":     new FunctionDsp(st.mathType, "cosh", new ArgsType([new ArgType(st.numberType)]), st.numberType),
    "exp":      new FunctionDsp(st.mathType, "exp", new ArgsType([new ArgType(st.numberType)]), st.numberType),
    "expm1":    new FunctionDsp(st.mathType, "expm1", new ArgsType([new ArgType(st.numberType)]), st.numberType),
    "floor":    new FunctionDsp(st.mathType, "floor", new ArgsType([new ArgType(st.numberType)]), st.numberType),
    "fround":   new FunctionDsp(st.mathType, "fround", new ArgsType([new ArgType(st.numberType)]), st.numberType),
    "hypot":    new FunctionDsp(st.mathType, "hypot", new ArgsType([new ArgType(st.numberType, true, false)]), st.numberType),
    "imul":     new FunctionDsp(st.mathType, "imul", new ArgsType([new ArgType(st.numberType), new ArgType(st.numberType)]), st.numberType),
    "log":      new FunctionDsp(st.mathType, "log", new ArgsType([new ArgType(st.numberType)]), st.numberType),
    "log1p":    new FunctionDsp(st.mathType, "log1p", new ArgsType([new ArgType(st.numberType)]), st.numberType),
    "log10":    new FunctionDsp(st.mathType, "log10", new ArgsType([new ArgType(st.numberType)]), st.numberType),
    "log2":     new FunctionDsp(st.mathType, "log2", new ArgsType([new ArgType(st.numberType)]), st.numberType),
    "max":      new FunctionDsp(st.mathType, "max", new ArgsType([new ArgType(st.numberType, true, false)]), st.numberType),
    "min":      new FunctionDsp(st.mathType, "min", new ArgsType([new ArgType(st.numberType, true, false)]), st.numberType),
    "pow":      new FunctionDsp(st.mathType, "pow", new ArgsType([new ArgType(st.numberType)]), st.numberType),
    "random":   new FunctionDsp(st.mathType, "random", new ArgsType([]), st.numberType),
    "round":    new FunctionDsp(st.mathType, "round", new ArgsType([new ArgType(st.numberType)]), st.numberType),
    "sign":     new FunctionDsp(st.mathType, "sign", new ArgsType([new ArgType(st.numberType)]), st.numberType),
    "sin":      new FunctionDsp(st.mathType, "sin", new ArgsType([new ArgType(st.numberType)]), st.numberType),
    "sinh":     new FunctionDsp(st.mathType, "sinh", new ArgsType([new ArgType(st.numberType)]), st.numberType),
    "sqrt":     new FunctionDsp(st.mathType, "sqrt", new ArgsType([new ArgType(st.numberType)]), st.numberType),
    "tan":      new FunctionDsp(st.mathType, "tan", new ArgsType([new ArgType(st.numberType)]), st.numberType),
    "tanh":     new FunctionDsp(st.mathType, "tanh", new ArgsType([new ArgType(st.numberType)]), st.numberType),
    "trunc":    new FunctionDsp(st.mathType, "trunc", new ArgsType([new ArgType(st.numberType)]), st.numberType),
};

// **************************************************************************************
//
// Date Specification
//
// **************************************************************************************
export const DateConstructorPropertyDsps = {
    "prototype": new PropertyDsp(st.constructorTypes.Date, "prototype", st.prototypeTypes.Date),
};

export const DateConstructorFunctionDsps = {
    "now":  new FunctionDsp(st.constructorTypes.Date, "now", new ArgsType([]), st.numberType),
    "parse":new FunctionDsp(st.constructorTypes.Date, "parse", new ArgsType([new ArgType(st.stringType)]), st.numberType),
    "UTC":  new FunctionDsp(st.constructorTypes.Date, "UTC", new ArgsType([
                new ArgType(st.numberType),
                new ArgType(st.numberType),
                new ArgType(st.numberType, false, true),
                new ArgType(st.numberType, false, true),
                new ArgType(st.numberType, false, true),
                new ArgType(st.numberType, false, true),
                new ArgType(st.numberType, false, true),
            ]), st.numberType),
};

export const DatePropertyDsps = {
    "__proto__": new PropertyDsp(st.dateType, "__proto__", st.prototypeTypes.Date),
};

export const DateFunctionDsps = {
    // getter
    "getDate":          new FunctionDsp(st.dateType, "getDate", new ArgsType([]), st.numberType),
    "getDay":           new FunctionDsp(st.dateType, "getDay", new ArgsType([]), st.numberType),
    "getFullYear":      new FunctionDsp(st.dateType, "getFullYear", new ArgsType([]), st.numberType),
    "getHours":         new FunctionDsp(st.dateType, "getHours", new ArgsType([]), st.numberType),
    "getMilliseconds":  new FunctionDsp(st.dateType, "getMilliseconds", new ArgsType([]), st.numberType),
    "getMinutes":       new FunctionDsp(st.dateType, "getMinutes", new ArgsType([]), st.numberType),
    "getMonth":         new FunctionDsp(st.dateType, "getMonth", new ArgsType([]), st.numberType),
    "getSeconds":       new FunctionDsp(st.dateType, "getSeconds", new ArgsType([]), st.numberType),
    "getTime":          new FunctionDsp(st.dateType, "getTime", new ArgsType([]), st.numberType),
    "getTimezoneOffset":new FunctionDsp(st.dateType, "getTimezoneOffset", new ArgsType([]), st.numberType),
    "getUTCDate":       new FunctionDsp(st.dateType, "getUTCDate", new ArgsType([]), st.numberType),
    "getUTCDay":        new FunctionDsp(st.dateType, "getUTCDay", new ArgsType([]), st.numberType),
    "getUTCFullYear":   new FunctionDsp(st.dateType, "getUTCFullYear", new ArgsType([]), st.numberType),
    "getUTCHours":      new FunctionDsp(st.dateType, "getUTCHours", new ArgsType([]), st.numberType),
    "getUTCMilliseconds": new FunctionDsp(st.dateType, "getUTCMilliseconds", new ArgsType([]), st.numberType),
    "getUTCMinutes":    new FunctionDsp(st.dateType, "getUTCMinutes", new ArgsType([]), st.numberType),
    "getUTCMonth":      new FunctionDsp(st.dateType, "getUTCMonth", new ArgsType([]), st.numberType),
    "getUTCSeconds":    new FunctionDsp(st.dateType, "getUTCSeconds", new ArgsType([]), st.numberType),
    "getYear":          new FunctionDsp(st.dateType, "getYear", new ArgsType([]), st.numberType),

    "setDate":          new FunctionDsp(st.dateType, "setDate", new ArgsType([new ArgType(st.numberType)]), st.undefinedType),
    "setFullYear":      new FunctionDsp(st.dateType, "setFullYear", new ArgsType([new ArgType(st.numberType), new ArgType(st.numberType, false, true), new ArgType(st.numberType, false, true)]), st.undefinedType),
    "setHours":         new FunctionDsp(st.dateType, "setHours", new ArgsType([new ArgType(st.numberType)]), st.undefinedType),
    "setMilliseconds":  new FunctionDsp(st.dateType, "setMilliseconds", new ArgsType([new ArgType(st.numberType)]), st.undefinedType),
    "setMinutes":       new FunctionDsp(st.dateType, "setMinutes", new ArgsType([new ArgType(st.numberType)]), st.undefinedType),
    "setMonth":         new FunctionDsp(st.dateType, "setMonth", new ArgsType([new ArgType(st.numberType)]), st.undefinedType),
    "setSeconds":       new FunctionDsp(st.dateType, "setSeconds", new ArgsType([new ArgType(st.numberType)]), st.undefinedType),
    "setTime":          new FunctionDsp(st.dateType, "setTime", new ArgsType([new ArgType(st.numberType)]), st.undefinedType),
    "setUTCDate":       new FunctionDsp(st.dateType, "setUTCDate", new ArgsType([new ArgType(st.numberType)]), st.undefinedType),
    "setUTCFullYear":   new FunctionDsp(st.dateType, "setUTCFullYear", new ArgsType([new ArgType(st.numberType), new ArgType(st.numberType, false, true), new ArgType(st.numberType, false, true)]), st.undefinedType),
    "setUTCHours":      new FunctionDsp(st.dateType, "setUTCHours", new ArgsType([new ArgType(st.numberType)]), st.undefinedType),
    "setUTCMilliseconds": new FunctionDsp(st.dateType, "setUTCMilliseconds", new ArgsType([new ArgType(st.numberType)]), st.undefinedType),
    "setUTCMinutes":    new FunctionDsp(st.dateType, "setUTCMinutes", new ArgsType([new ArgType(st.numberType)]), st.undefinedType),
    "setUTCMonth":      new FunctionDsp(st.dateType, "setUTCMonth", new ArgsType([new ArgType(st.numberType)]), st.undefinedType),
    "setUTCSeconds":    new FunctionDsp(st.dateType, "setUTCSeconds", new ArgsType([new ArgType(st.numberType)]), st.undefinedType),
    "setYear":          new FunctionDsp(st.dateType, "setYear", new ArgsType([new ArgType(st.numberType)]), st.undefinedType),

    "toDateString":     new FunctionDsp(st.dateType, "toDateString", new ArgsType([]), st.stringType),
    "toISOString":      new FunctionDsp(st.dateType, "toISOString", new ArgsType([]), st.stringType),
    "toJSON":           new FunctionDsp(st.dateType, "toJSON", new ArgsType([]), st.stringType),
    "toGMTString":      new FunctionDsp(st.dateType, "toGMTString", new ArgsType([]), st.stringType),
    "toLocaleDateString": new FunctionDsp(st.dateType, "toLocaleDateString", new ArgsType([]), st.stringType),
    "toLocaleFormat":   new FunctionDsp(st.dateType, "toLocaleFormat", new ArgsType([]), st.stringType),
    "toLocaleString":   new FunctionDsp(st.dateType, "toLocaleString", new ArgsType([]), st.stringType),
    "toLocaleTimeString": new FunctionDsp(st.dateType, "toLocaleTimeString", new ArgsType([]), st.stringType),
    "toSource":         new FunctionDsp(st.dateType, "toSource", new ArgsType([]), st.stringType),
    "toString":         new FunctionDsp(st.dateType, "toString", new ArgsType([]), st.stringType),
    "toTimeString":     new FunctionDsp(st.dateType, "toTimeString", new ArgsType([]), st.stringType),
    "toUTILSCString":   new FunctionDsp(st.dateType, "toUTILSCString", new ArgsType([]), st.stringType),
    "valueOf":          new FunctionDsp(st.dateType, "valueOf", new ArgsType([]), st.stringType),
}

// **************************************************************************************
//
// String Specification
//
// **************************************************************************************
export const StringConstructorPropertyDsps = {
    "prototype": new PropertyDsp(st.constructorTypes.String, "prototype", st.prototypeTypes.String),
};

export const StringConstructorFunctionDsps = {
    "fromCharCode": new FunctionDsp(st.constructorTypes.String, "fromCharCode", new ArgsType([new ArgType(st.numberType, true, false)]), st.stringType),
    "fromCodePoint": new FunctionDsp(st.constructorTypes.String, "fromCodePoint", new ArgsType([new ArgType(st.numberType, true, false)]), st.stringType),
    // "raw"
};

export const StringPropertyDsps = {
    "length": new PropertyDsp(st.stringType, "length", st.numberType),
    "__proto__": new PropertyDsp(st.stringType, "__proto__", st.prototypeTypes.String),
    "constructor": new PropertyDsp(st.stringType, "constructor", st.constructorTypes.String), 
};

export const StringFunctionDsps = {
    "charAt":       new FunctionDsp(st.stringType, "charAt", new ArgsType([new ArgType(st.numberType)]), st.stringType),
    "charCodeAt":   new FunctionDsp(st.stringType, "charCodeAt", new ArgsType([new ArgType(st.numberType)]), st.numberType),
    "codePointAt":  new FunctionDsp(st.stringType, "codePointAt", new ArgsType([new ArgType(st.numberType)]), st.numberType),
    "concat":       new FunctionDsp(st.stringType, "concat", new ArgsType([new ArgType(st.stringType, true, false)]), st.stringType),
    "includes":     new FunctionDsp(st.stringType, "includes", new ArgsType([new ArgType(st.stringType), new ArgType(st.numberType)]), st.booleanType),
    "endsWith":     new FunctionDsp(st.stringType, "endsWith", new ArgsType([new ArgType(st.stringType), new ArgType(st.numberType, false, true)]), st.booleanType),
    "indexOf":      new FunctionDsp(st.stringType, "indexOf", new ArgsType([new ArgType(st.stringType), new ArgType(st.numberType, false, true)]), st.numberType),
    "lastIndexOf":  new FunctionDsp(st.stringType, "lastIndexOf", new ArgsType([new ArgType(st.stringType)]), st.numberType),
    "localeCompare":new FunctionDsp(st.stringType, "localeCompare", new ArgsType([new ArgType(st.stringType)]), st.numberType),
    "match":        new FunctionDsp(st.stringType, "match", new ArgsType([new ArgType(st.regexpType)]), st.arrayType),
    "normalize":    new FunctionDsp(st.stringType, "normalize", new ArgsType([]), st.undefinedType),
    "padEnd":       new FunctionDsp(st.stringType, "padEnd", new ArgsType([new ArgType(st.numberType), new ArgType(st.stringType, false, true)]), st.stringType),
    "padStart":     new FunctionDsp(st.stringType, "padStart", new ArgsType([new ArgType(st.numberType), new ArgType(st.stringType, false ,true)]), st.stringType),
    "repeat":       new FunctionDsp(st.stringType, "repeat", new ArgsType([new ArgType(st.numberType)]), st.stringType),
    "replace":      new FunctionDsp(st.stringType, "replace", new ArgsType([new ArgType(st.regexpType), new ArgType(st.stringType)]), st.stringType),
    "search":       new FunctionDsp(st.stringType, "search", new ArgsType([new ArgType(st.regexpType)]), st.numberType),
    "slice":        new FunctionDsp(st.stringType, "slice", new ArgsType([new ArgType(st.numberType), new ArgType(st.numberType, false, true)]), st.stringType),
    "split":        new FunctionDsp(st.stringType, "split", new ArgsType([new ArgType(st.stringType), new ArgType(st.numberType, false, true)]), st.arrayType),
    "startsWith":   new FunctionDsp(st.stringType, "startsWith", new ArgsType([new ArgType(st.stringType), new ArgType(st.numberType, false, true)]), st.booleanType),
    "substr":       new FunctionDsp(st.stringType, "substr", new ArgsType([new ArgType(st.numberType), new ArgType(st.numberType, false, true)]), st.stringType),
    "substring":    new FunctionDsp(st.stringType, "substring", new ArgsType([new ArgType(st.numberType), new ArgType(st.numberType, false, true)]), st.stringType),
    "toLocaleLowerCase": new FunctionDsp(st.stringType, "toLocaleLowerCase", new ArgsType([]), st.stringType),
    "toLocaleUpperCase": new FunctionDsp(st.stringType, "toLocaleUpperCase", new ArgsType([]), st.stringType),
    "toLowerCase":  new FunctionDsp(st.stringType, "toLowerCase", new ArgsType([]), st.stringType),
    "toString":     new FunctionDsp(st.stringType, "toString", new ArgsType([]), st.stringType),
    "toUpperCase":  new FunctionDsp(st.stringType, "toUpperCase", new ArgsType([]), st.stringType),
    "trim":         new FunctionDsp(st.stringType, "trim", new ArgsType([]), st.stringType),
    "trimLeft":     new FunctionDsp(st.stringType, "trimLeft", new ArgsType([]), st.stringType),
    "trimRight":    new FunctionDsp(st.stringType, "trimRight", new ArgsType([]), st.stringType),
    "valueOf":      new FunctionDsp(st.stringType, "valueOf", new ArgsType([]), st.stringType),
};

// **************************************************************************************
//
// RegExp Specification
//
// **************************************************************************************
export const RegExpConstructorPropertyDsps = {
    "prototype": new PropertyDsp(st.constructorTypes.RegExp, "prototype", st.prototypeTypes.RegExp),   
    "$1": new PropertyDsp(st.constructorTypes.RegExp, "$1", st.stringType),
    "$2": new PropertyDsp(st.constructorTypes.RegExp, "$2", st.stringType),
    "$3": new PropertyDsp(st.constructorTypes.RegExp, "$3", st.stringType),
    "$4": new PropertyDsp(st.constructorTypes.RegExp, "$4", st.stringType),
    "$5": new PropertyDsp(st.constructorTypes.RegExp, "$5", st.stringType),
    "$6": new PropertyDsp(st.constructorTypes.RegExp, "$6", st.stringType),
    "$7": new PropertyDsp(st.constructorTypes.RegExp, "$7", st.stringType),
    "$8": new PropertyDsp(st.constructorTypes.RegExp, "$8", st.stringType),
    "$9": new PropertyDsp(st.constructorTypes.RegExp, "$9", st.stringType),
    "$_": new PropertyDsp(st.constructorTypes.RegExp, "$_", st.stringType),
    // "[\"$*\"]": new PropertyDsp(st.constructorTypes.RegExp, "[\"$*\"]", st.booleanType),
    // "[\"$&\"]": new PropertyDsp(st.constructorTypes.RegExp, "[\"$&\"]", st.stringType),
    // "[\"$+\"]": new PropertyDsp(st.constructorTypes.RegExp, "[\"$+\"]", st.stringType),
    // "[\"$`\"]": new PropertyDsp(st.constructorTypes.RegExp, "[\"$`\"]", st.stringType),
    // "[\"$'\"]": new PropertyDsp(st.constructorTypes.RegExp, "[\"$'\"]", st.stringType),
    "input": new PropertyDsp(st.constructorTypes.RegExp, "input", st.stringType),
    "lastMatch": new PropertyDsp(st.constructorTypes.RegExp, "lastMatch", st.stringType),
    "lastParen": new PropertyDsp(st.constructorTypes.RegExp, "Paren", st.stringType),
    "leftContext": new PropertyDsp(st.constructorTypes.RegExp, "leftContext", st.stringType),
    "rightContext": new PropertyDsp(st.constructorTypes.RegExp, "rightContext", st.stringType), 
    "length": new PropertyDsp(st.constructorTypes.RegExp, "length", st.numberType),
};

export const RegExpPropertyDsps = {
    "flags":    new PropertyDsp(st.regexpType, "flags", st.stringType),
    "global":   new PropertyDsp(st.regexpType, "global", st.booleanType),
    "source":   new PropertyDsp(st.regexpType, "source", st.stringType),
    "ignoreCase": new PropertyDsp(st.regexpType, "ignoreCase", st.booleanType),
    "multiline":new PropertyDsp(st.regexpType, "multiline", st.booleanType),
    "sticky":   new PropertyDsp(st.regexpType, "sticky", st.booleanType),
    "unicode":  new PropertyDsp(st.regexpType, "unicode", st.booleanType),
    "lastIndex":new PropertyDsp(st.regexpType, "lastIndex", st.numberType),
    "__proto__": new PropertyDsp(st.regexpType, "__proto__", st.prototypeTypes.RegExp),  
};

export const RegExpFunctionDsps = {
    "compile": new FunctionDsp(st.regexpType, "compile", new ArgsType([new ArgType(st.regexpType)]), st.undefinedType),
    "exec": new FunctionDsp(st.regexpType, "exec", new ArgsType([new ArgType(st.stringType)]), st.arrayType),
    "test": new FunctionDsp(st.regexpType, "test", new ArgsType([new ArgType(st.stringType)]), st.booleanType),
    // "toSource": new FunctionDsp(st.regexpType, "toSource", new ArgsType([]), st.stringType),
    "toString": new FunctionDsp(st.regexpType, "toString", new ArgsType([]), st.stringType),
};

// **************************************************************************************
//
// Array Specification
//
// **************************************************************************************
export const ArrayConstructorPropertyDsps = {
    "prototype": new PropertyDsp(st.constructorTypes.Array, "prototype", st.prototypeTypes.Array),
};

export const ArrayConstructorFunctionDsps = {
    "from": new FunctionDsp(st.constructorTypes.Array, "from", new ArgsType([new ArgType(st.iterableType), new ArgType(new FunctionExpressionType(new ArgsType([st.argType]), st.anyType), false, true), st.argType]), st.arrayType), 
    "isArray": new FunctionDsp(st.constructorTypes.Array, "isArray", new ArgsType([new ArgType(st.anyType)]), st.booleanType),
    // "observe": new FunctionDsp(st.constructorTypes.Array, "observe", new ArgsType([]), st.undefinedType),
    "of": new FunctionDsp(st.constructorTypes.Array, "of", new ArgsType([new ArgType(st.anyType, true, false)]), st.arrayType),   
};

export const ArrayPropertyDsps = {
    "length": new PropertyDsp(st.arrayType, "length", st.numberType),
    "constructor": new PropertyDsp(st.arrayType, "constructor", st.constructorTypes.Array), 
    "__proto__": new PropertyDsp(st.arrayType, "__proto__", st.prototypeTypes.Array),
};

export const ArrayFunctionDsps = {
    "copyWithin": new FunctionDsp(st.arrayType, "copyWithin", 
            new ArgsType([new ArgType(st.numberType), 
                new ArgType(st.numberType, false ,true), 
                new ArgType(st.numberType, false, true)
            ]), st.arrayType),
    "fill": new FunctionDsp(st.arrayType, "fill", 
            new ArgsType([new ArgType(st.anyType), 
                new ArgType(st.numberType), 
                new ArgType(st.numberType)]
            ), st.arrayType),
    "pop":      new FunctionDsp(st.arrayType, "pop", new ArgsType([]), st.anyType),
    "push":     new FunctionDsp(st.arrayType, "push", new ArgsType([new ArgType(st.anyType, true, false)]), st.numberType),
    "reverse":  new FunctionDsp(st.arrayType, "reverse", new ArgsType([]), st.arrayType),
    "shift":    new FunctionDsp(st.arrayType, "shift", new ArgsType([]), st.anyType),
    "sort":     new FunctionDsp(st.arrayType, "sort", new ArgsType([
                    new ArgType(
                        new FunctionExpressionType(new ArgsType([new ArgType(st.anyType), new ArgType(st.anyType)]), st.numberType), 
                    false, true)
                ]), st.arrayType),
    "splice":   new FunctionDsp(st.arrayType, "splice", new ArgsType([new ArgType(st.numberType), new ArgType(st.numberType, false, true), new ArgType(st.anyType, true, true)]), st.arrayType),
    "unshift":  new FunctionDsp(st.arrayType, "unshift", new ArgsType([]), st.undefinedType),

    "concat":   new FunctionDsp(st.arrayType, "concat", new ArgsType([new ArgType(st.anyType, true, false)]), st.arrayType),
    "includes": new FunctionDsp(st.arrayType, "includes", new ArgsType([new ArgType(st.anyType), new ArgType(st.numberType, false, true)]), st.booleanType),
    "join":     new FunctionDsp(st.arrayType, "join", new ArgsType([new ArgType(st.stringType, false, true)]), st.stringType),
    "slice":    new FunctionDsp(st.arrayType, "slice", new ArgsType([new ArgType(st.numberType, false, true), new ArgType(st.numberType, false, true)]), st.arrayType),
    "toSource": new FunctionDsp(st.arrayType, "toSource", new ArgsType([]), st.undefinedType),
    "toString": new FunctionDsp(st.arrayType, "toString", new ArgsType([]), st.stringType),
    "toLocaleString": new FunctionDsp(st.arrayType, "toLocaleString", new ArgsType([]), st.stringType),
    "indexOf":  new FunctionDsp(st.arrayType, "indexOf", new ArgsType([new ArgType(st.anyType), new ArgType(st.numberType, false, true)]), st.numberType),
    "lastIndexOf": new FunctionDsp(st.arrayType, "lastIndexOf", new ArgsType([new ArgType(st.anyType), new ArgType(st.numberType, false, true)]), st.numberType),

    "entries": new FunctionDsp(st.arrayType, "entries", new ArgsType([]), st.iteratorType),
    "every":    new FunctionDsp(st.arrayType, "every", new ArgsType([
                    new ArgType(
                        new FunctionExpressionType(new ArgsType([
                            new ArgType(st.anyType), new ArgType(st.numberType), new ArgType(st.arrayType)
                        ]), st.booleanType)
                    )
                ]), st.booleanType),
    "filter":   new FunctionDsp(st.arrayType, "filter", new ArgsType([
                    new ArgType(
                        new FunctionExpressionType(new ArgsType([
                            new ArgType(st.anyType), new ArgType(st.numberType), new ArgType(st.arrayType)
                        ]), st.booleanType)     
                    )
                ]), st.arrayType),
    "find":     new FunctionDsp(st.arrayType, "find", new ArgsType([
                    new ArgType(
                        new FunctionExpressionType(new ArgsType([
                            new ArgType(st.anyType), new ArgType(st.numberType), new ArgType(st.arrayType)
                        ]), st.booleanType)   
                    )
                ]), st.anyType),
    "findIndex": new FunctionDsp(st.arrayType, "findIndex", new ArgsType([
                    new ArgType(
                        new FunctionExpressionType(new ArgsType([
                            new ArgType(st.anyType), new ArgType(st.numberType), new ArgType(st.arrayType)
                        ]), st.booleanType)   
                    )
                ]), st.numberType),
    "forEach":  new FunctionDsp(st.arrayType, "forEach", new ArgsType([
                    new ArgType(
                        new FunctionExpressionType(new ArgsType([
                            new ArgType(st.anyType), new ArgType(st.numberType), new ArgType(st.arrayType)
                        ]), st.anyType)   
                    )
                ]), st.undefinedType),
    "keys":     new FunctionDsp(st.arrayType, "keys", new ArgsType([]), st.iteratorType),
    "map":      new FunctionDsp(st.arrayType, "map", new ArgsType([
                    new ArgType(
                        new FunctionExpressionType(new ArgsType([
                            new ArgType(st.anyType), new ArgType(st.numberType), new ArgType(st.arrayType)
                        ]), st.anyType)   
                    )
                ]), st.arrayType),
    "reduce":   new FunctionDsp(st.arrayType, "reduce", new ArgsType([
                    new ArgType(
                        new FunctionExpressionType(new ArgsType([
                            new ArgType(st.anyType), new ArgType(st.anyType), new ArgType(st.numberType), new ArgType(st.arrayType)
                        ]), st.anyType)   
                    )
                ]), st.anyType),
    "reduceRight":   new FunctionDsp(st.arrayType, "reduceRight", new ArgsType([
                    new ArgType(
                        new FunctionExpressionType(new ArgsType([
                            new ArgType(st.anyType), new ArgType(st.anyType), new ArgType(st.numberType), new ArgType(st.arrayType)
                        ]), st.anyType)   
                    )
                ]), st.anyType),
    "some":  new FunctionDsp(st.arrayType, "some", new ArgsType([
                    new ArgType(
                        new FunctionExpressionType(new ArgsType([
                            new ArgType(st.anyType), new ArgType(st.numberType), new ArgType(st.arrayType)
                        ]), st.booleanType)
                    )
                ]), st.booleanType),
    "values":new FunctionDsp(st.arrayType, "values", new ArgsType([]), st.iteratorType),
};

// **************************************************************************************
//
// TypedArray Specification
//
// **************************************************************************************
export const TypedArrayConstructorPropertyDsps = {
    "prototype": new PropertyDsp(st.constructorTypes.TypedArray, "prototype", st.prototypeTypes.TypedArray),
    "BYTES_PER_ELEMENT": new PropertyDsp(st.constructorTypes.TypedArray, "BYTES_PER_ELEMENT", st.numberType),
    "name": new PropertyDsp(st.constructorTypes.TypedArray, "name", st.stringType)
};

export const TypedArrayConstructorFunctionDsps = {
    "from": new FunctionDsp(st.constructorTypes.TypedArray, "from", new ArgsType([new ArgType(st.iterableType), new ArgType(new FunctionExpressionType(new ArgsType([st.argType]), st.anyType), false, true), st.argType]), st.typedarrayType),
    "of":   new FunctionDsp(st.constructorTypes.TypedArray, "of", new ArgsType([new ArgType(st.numberType, true, false)]), st.typedarrayType),
};

export const TypedArrayPropertyDsps = {
    "length":       new PropertyDsp(st.typedarrayType, "length", st.numberType),
    "constructor":  new PropertyDsp(st.typedarrayType, "constructor", st.constructorTypes.TypedArray), 
    "buffer":       new PropertyDsp(st.typedarrayType, "buffer", st.arraybufferType),
    "byteLength":   new PropertyDsp(st.typedarrayType, "byteLength", st.numberType),
    "byteOffset":   new PropertyDsp(st.typedarrayType, "byteOffset", st.numberType),
    "__proto__":    new PropertyDsp(st.typedarrayType, "prototype", st.prototypeTypes.TypedArray),
};

export const TypedArrayFunctionDsps = {
    "copyWithin": new FunctionDsp(st.typedarrayType, "copyWithin", new ArgsType([
                    new ArgType(st.numberType), new ArgType(st.numberType), new ArgType(st.numberType, false, true)
                  ]), st.typedarrayType),
    "entries":  new FunctionDsp(st.typedarrayType, "entries", new ArgsType([]), st.iteratorType),
    "every":    new FunctionDsp(st.typedarrayType, "every", new ArgsType([
                    new ArgType(
                        new FunctionExpressionType(new ArgsType([
                            new ArgType(st.numberType), new ArgType(st.numberType), new ArgType(st.typedarrayType)
                        ]), st.booleanType)
                    )
                ]), st.booleanType),
    "fill":     new FunctionDsp(st.typedarrayType, "fill", new ArgsType([
                    new ArgType(st.numberType), new ArgType(st.numberType), new ArgType(st.numberType)
                ]), st.undefinedType),
    "filter":   new FunctionDsp(st.typedarrayType, "filter", new ArgsType([
                    new ArgType(
                        new FunctionExpressionType(new ArgsType([
                            new ArgType(st.numberType), new ArgType(st.numberType), new ArgType(st.typedarrayType)
                        ]), st.booleanType)
                    )
                ]), st.typedarrayType),
    "find":     new FunctionDsp(st.typedarrayType, "find", new ArgsType([
                    new ArgType(
                        new FunctionExpressionType(new ArgsType([
                            new ArgType(st.numberType), new ArgType(st.numberType), new ArgType(st.typedarrayType)
                        ]), st.booleanType)
                    )
                ]), st.numberType),
    "findIndex":new FunctionDsp(st.typedarrayType, "findIndex", new ArgsType([
                    new ArgType(
                        new FunctionExpressionType(new ArgsType([
                            new ArgType(st.numberType), new ArgType(st.numberType), new ArgType(st.typedarrayType)
                        ]), st.booleanType)
                    )
                ]), st.numberType),
    "forEach":  new FunctionDsp(st.typedarrayType, "findIndex", new ArgsType([
                    new ArgType(
                        new FunctionExpressionType(new ArgsType([
                            new ArgType(st.numberType), new ArgType(st.numberType), new ArgType(st.typedarrayType)
                        ]), st.booleanType)
                    )
                ]), st.undefinedType),
    "includes": new FunctionDsp(st.typedarrayType, "includes", new ArgsType([
                    new ArgType(st.numberType), new ArgType(st.numberType, false, true)]), st.booleanType),
    "indexOf":  new FunctionDsp(st.typedarrayType, "indexOf", new ArgsType([
                    new ArgType(st.numberType), new ArgType(st.numberType, false, true)]), st.numberType),
    "join":     new FunctionDsp(st.typedarrayType, "join", new ArgsType([new ArgType(st.stringType, false, true)]), st.stringType),
    "keys":     new FunctionDsp(st.typedarrayType, "keys", new ArgsType([]), st.iteratorType),
    "lastIndexOf": new FunctionDsp(st.typedarrayType, "lastIndexOf", new ArgsType([
                    new ArgType(st.numberType), new ArgType(st.numberType, false, true)]), st.numberType),
    "map":      new FunctionDsp(st.typedarrayType, "map", new ArgsType([
                    new ArgType(
                        new FunctionExpressionType(new ArgsType([
                            new ArgType(st.numberType), new ArgType(st.numberType), new ArgType(st.typedarrayType)
                        ]), st.numberType)
                    )
                ]), st.typedarrayType),
    "reduce":   new FunctionDsp(st.typedarrayType, "reduce", new ArgsType([
                    new ArgType(
                        new FunctionExpressionType(new ArgsType([
                            new ArgType(st.numberType), new ArgType(st.numberType), new ArgType(st.numberType), new ArgType(st.typedarrayType)
                        ]), st.numberType)
                    )
                ]), st.numberType),
    "reduceRight":   new FunctionDsp(st.typedarrayType, "reduceRight", new ArgsType([
                    new ArgType(
                        new FunctionExpressionType(new ArgsType([
                            new ArgType(st.numberType), new ArgType(st.numberType), new ArgType(st.numberType), new ArgType(st.typedarrayType)
                        ]), st.numberType)
                    )
                ]), st.numberType),
    "reverse":  new FunctionDsp(st.typedarrayType, "reverse", new ArgsType([]), st.typedarrayType),
    "set":      new FunctionDsp(st.typedarrayType, "set", new ArgsType([
                    new ArgType(new MixedType([st.typedarrayType, st.arrayType])), 
                    new ArgType(st.numberType)]), st.undefinedType),
    "slice":    new FunctionDsp(st.typedarrayType, "slice", new ArgsType([
                    new ArgType(st.numberType, false, true), 
                    new ArgType(st.numberType, false, true)]), st.typedarrayType),
    "some":    new FunctionDsp(st.typedarrayType, "some", new ArgsType([
                    new ArgType(
                        new FunctionExpressionType(new ArgsType([
                            new ArgType(st.numberType), new ArgType(st.numberType), new ArgType(st.typedarrayType)
                        ]), st.booleanType)
                    )
                ]), st.booleanType),
    "sort":    new FunctionDsp(st.typedarrayType, "sort", new ArgsType([
                    new ArgType(
                        new FunctionExpressionType(new ArgsType([
                            new ArgType(st.numberType), new ArgType(st.numberType)
                        ]), st.booleanType), 
                    false, true)
                ]), st.typedarrayType),
    "subArray": new FunctionDsp(st.typedarrayType, "subArray", new ArgsType([
                    new ArgType(st.numberType, false, true), 
                    new ArgType(st.numberType, false, true)]), st.typedarrayType),
    "values":   new FunctionDsp(st.typedarrayType, "values", new ArgsType([]), st.iteratorType),
    "toLocaleString": new FunctionDsp(st.typedarrayType, "toLocaleString", new ArgsType([]), st.stringType),
    "toString": new FunctionDsp(st.typedarrayType, "toString", new ArgsType([]), st.stringType),
    // "move": new FunctionDsp(st.typedarrayType, "move", new ArgsType([]), st.iteratorType),
};

// **************************************************************************************
//
// Map Specification
//
// **************************************************************************************
export const MapConstructorPropertyDsps = {
    "prototype": new PropertyDsp(st.constructorTypes.Map, "prototype", st.prototypeTypes.Map),
};

export const MapPropertyDsps = {
    "size":         new PropertyDsp(st.mapType, "size", st.numberType),
    "constructor":  new PropertyDsp(st.mapType, "constructor", st.constructorTypes.Map), 
    "__proto__":    new PropertyDsp(st.mapType, "__proto__", st.prototypeTypes.Map),
};

export const MapFunctionDsps = {
    "clear":    new FunctionDsp(st.mapType, "clear", new ArgsType([]), st.undefinedType),
    "delete":   new FunctionDsp(st.mapType, "delete", new ArgsType([new ArgType(st.anyType)]), st.booleanType),
    "entries":  new FunctionDsp(st.mapType, "entries", new ArgsType([]), st.iteratorType),
    "forEach":  new FunctionDsp(st.mapType, "forEach", new ArgsType([
                    new ArgType(
                        new FunctionExpressionType(new ArgsType([
                            new ArgType(st.anyType), new ArgType(st.anyType), new ArgType(st.mapType)
                        ]), st.anyType)
                    )
                ]), st.undefinedType),
    "get":      new FunctionDsp(st.mapType, "get", new ArgsType([new ArgType(st.anyType)]), st.anyType),
    "has":      new FunctionDsp(st.mapType, "has", new ArgsType([new ArgType(st.anyType)]), st.booleanType),
    "keys":     new FunctionDsp(st.mapType, "keys", new ArgsType([]), st.iteratorType),
    "set":      new FunctionDsp(st.mapType, "set", new ArgsType([new ArgType(st.anyType), new ArgType(st.anyType)]), st.anyType),
    "values":   new FunctionDsp(st.mapType, "values", new ArgsType([]), st.iteratorType),
};

// **************************************************************************************
//
// Set Specification
//
// **************************************************************************************
export const SetConstructorPropertyDsps = {
    "prototype": new PropertyDsp(st.constructorTypes.Set, "prototype", st.prototypeTypes.Set),
};

export const SetPropertyDsps = {
    "size":         new PropertyDsp(st.setType, "size", st.numberType),
    "constructor":  new PropertyDsp(st.setType, "constructor", st.constructorTypes.Set), 
    "__proto__": new PropertyDsp(st.setType, "__proto__", st.prototypeTypes.Set),
};

export const SetFunctionDsps = {
    "add":      new FunctionDsp(st.setType, "add", new ArgsType([new ArgType(st.anyType)]), st.setType),
    "clear":    new FunctionDsp(st.setType, "clear", new ArgsType([]), st.undefinedType),
    "delete":   new FunctionDsp(st.setType, "delete", new ArgsType([new ArgType(st.anyType)]), st.booleanType),
    "entries":  new FunctionDsp(st.setType, "entries", new ArgsType([]), st.iteratorType),
    "forEach":  new FunctionDsp(st.setType, "forEach", new ArgsType([
                    new ArgType(
                        new FunctionExpressionType(new ArgsType([
                            new ArgType(st.anyType), new ArgType(st.anyType), new ArgType(st.setType)
                        ]), st.anyType)
                    )
                ]), st.undefinedType),
    "has":      new FunctionDsp(st.setType, "has", new ArgsType([new ArgType(st.anyType)]), st.booleanType),
    "keys":     new FunctionDsp(st.setType, "keys", new ArgsType([]), st.iteratorType),
    "values":   new FunctionDsp(st.setType, "values", new ArgsType([]), st.iteratorType),
};

// **************************************************************************************
//
// WeakMap Specification
//
// **************************************************************************************
export const WeakMapConstructorPropertyDsps = {
    "prototype": new PropertyDsp(st.constructorTypes.WeakMap, "prototype", st.prototypeTypes.WeakMap),
};

export const WeakMapPropertyDsps = {
    "constructor":  new PropertyDsp(st.weakmapType, "constructor", st.constructorTypes.WeakMap), 
    "__proto__":    new PropertyDsp(st.weakmapType, "__proto__", st.prototypeTypes.WeakMap),
};

export const WeakMapFunctionDsps = {
    "delete":   new FunctionDsp(st.weakmapType, "delete", new ArgsType([new ArgType(st.objectType)]), st.booleanType),
    "get":      new FunctionDsp(st.weakmapType, "get", new ArgsType([new ArgType(st.objectType)]), st.anyType),
    "has":      new FunctionDsp(st.weakmapType, "has", new ArgsType([new ArgType(st.objectType)]), st.booleanType),
    "set":      new FunctionDsp(st.weakmapType, "set", new ArgsType([new ArgType(st.objectType), new ArgType(st.anyType)]), st.weakmapType),
};

// **************************************************************************************
//
// WeakSet Specification
//
// **************************************************************************************
export const WeakSetConstructorPropertyDsps = {
    "prototype": new PropertyDsp(st.constructorTypes.WeakSet, "prototype", st.prototypeTypes.WeakSet),
};

export const WeakSetPropertyDsps = {
    "constructor":  new PropertyDsp(st.weaksetType, "constructor", st.constructorTypes.WeakSet), 
    "__proto__": new PropertyDsp(st.weaksetType, "__proto__", st.prototypeTypes.WeakSet),
};

export const WeakSetFunctionDsps = {
    "delete":   new FunctionDsp(st.weaksetType, "delete", new ArgsType([new ArgType(st.objectType)]), st.booleanType),
    "has":      new FunctionDsp(st.weaksetType, "has", new ArgsType([new ArgType(st.objectType)]), st.booleanType),
    "add":      new FunctionDsp(st.weaksetType, "add", new ArgsType([new ArgType(st.objectType)]), st.weaksetType),
};

// **************************************************************************************
//
// ArrayBuffer Specification
//
// **************************************************************************************
export const ArrayBufferConstructorPropertyDsps = {
    "prototype": new PropertyDsp(st.constructorTypes.ArrayBuffer, "prototype", st.prototypeTypes.ArrayBuffer),
};

export const ArrayBufferConstructorFunctionDsps = {
    "isView":   new FunctionDsp(st.constructorTypes.ArrayBuffer, "isView", new ArgsType([new ArgType(st.anyType)]), st.booleanType),
    "transfer": new FunctionDsp(st.constructorTypes.ArrayBuffer, "transfer", new ArgsType([new ArgType(st.arraybufferType), new ArgType(st.numberType, false, true)]), st.booleanType),
};

export const ArrayBufferPropertyDsps = {
    "constructor":  new PropertyDsp(st.arraybufferType, "constructor", st.constructorTypes.ArrayBuffer), 
    "byteLength":   new PropertyDsp(st.arraybufferType, "byteLength", st.numberType),
    "__proto__":    new PropertyDsp(st.arraybufferType, "__proto__", st.prototypeTypes.ArrayBuffer),
};

export const ArrayBufferFunctionDsps = {
    "slice": new FunctionDsp(st.arraybufferType, "slice", new ArgsType([
                new ArgType(st.numberType), new ArgType(st.numberType, false, true),
            ]), st.arraybufferType),
};

// **************************************************************************************
//
// SharedArrayBuffer Specification
//
// **************************************************************************************
/*
export const SharedArrayBufferConstructorPropertyDsps = {
    "prototype": new PropertyDsp(st.constructorTypes.SharedArrayBuffer, "prototype", st.prototypeTypes.SharedArrayBuffer),
};

export const SharedArrayBufferConstructorFunctionDsps = {
};

export const SharedArrayBufferPropertyDsps = {
    "constructor":  new PropertyDsp(st.sharedarraybufferType, "constructor", st.constructorTypes.SharedArrayBuffer), 
    "byteLength":   new PropertyDsp(st.sharedarraybufferType, "byteLength", st.numberType),
    "__proto__":    new PropertyDsp(st.sharedarraybufferType, "__proto__", st.prototypeTypes.SharedArrayBuffer),
};

export const SharedArrayBufferFunctionDsps = {
    "slice": new FunctionDsp(st.sharedarraybufferType, "slice", new ArgsType([
                new ArgType(st.numberType, false, true), new ArgType(st.numberType, false, true),
            ]), st.sharedarraybufferType),
};
*/

// **************************************************************************************
//
// Atomics Specification
//
// **************************************************************************************
/*
export const AtomicsFunctionDsps = {
    "add": new FunctionDsp(st.constructorTypes.Atomics, "add", new ArgsType([
                new ArgType(st.typedarrayType), new ArgType(st.numberType), new ArgType(st.numberType)]), st.numberType),
    "and": new FunctionDsp(st.constructorTypes.Atomics, "and", new ArgsType([
                new ArgType(st.typedarrayType), new ArgType(st.numberType), new ArgType(st.numberType)]), st.numberType),
    "compareExchange": new FunctionDsp(st.constructorTypes.Atomics, "compareExchange", new ArgsType([
                new ArgType(st.typedarrayType), new ArgType(st.numberType), 
                new ArgType(st.numberType), new ArgType(st.numberType)]), st.numberType),
    "exchange": new FunctionDsp(st.constructorTypes.Atomics, "exchange", new ArgsType([
                new ArgType(st.typedarrayType), new ArgType(st.numberType), new ArgType(st.numberType)]), st.numberType),
    "load": new FunctionDsp(st.constructorTypes.Atomics, "load", new ArgsType([
                new ArgType(st.typedarrayType), new ArgType(st.numberType)]), st.numberType),
    "or": new FunctionDsp(st.constructorTypes.Atomics, "or", new ArgsType([
                new ArgType(st.typedarrayType), new ArgType(st.numberType), new ArgType(st.numberType)]), st.numberType),
    "store": new FunctionDsp(st.constructorTypes.Atomics, "store", new ArgsType([
                new ArgType(st.typedarrayType), new ArgType(st.numberType), new ArgType(st.numberType)]), st.numberType),
    "sub": new FunctionDsp(st.constructorTypes.Atomics, "sub", new ArgsType([
                new ArgType(st.typedarrayType), new ArgType(st.numberType), new ArgType(st.numberType)]), st.numberType),
    "xor": new FunctionDsp(st.constructorTypes.Atomics, "xor", new ArgsType([
                new ArgType(st.typedarrayType), new ArgType(st.numberType), new ArgType(st.numberType)]), st.numberType),
    "wait": new FunctionDsp(st.constructorTypes.Atomics, "wait", new ArgsType([
                new ArgType(st.typedarrayType), new ArgType(st.numberType), 
                new ArgType(st.numberType), new ArgType(st.numberType, false, true)]), st.stringType),
    "notify": new FunctionDsp(st.constructorTypes.Atomics, "notify", new ArgsType([
                new ArgType(st.typedarrayType), new ArgType(st.numberType), new ArgType(st.numberType)]), st.numberType),
    "isLockFree": new FunctionDsp(st.constructorTypes.Atomics, "isLockFree", new ArgsType([new ArgType(st.numberType)]), st.booleanType),
};
*/

// **************************************************************************************
//
// DataView Specification
//
// **************************************************************************************
export const DataViewConstructorPropertyDsps = {
    "prototype": new PropertyDsp(st.constructorTypes.DataView, "prototype", st.prototypeTypes.DataView),
};

export const DataViewPropertyDsps = {
    "constructor":  new PropertyDsp(st.dataviewType, "constructor", st.constructorTypes.DataView), 
    "buffer":       new PropertyDsp(st.dataviewType, "buffer", st.arraybufferType),
    "byteLength":   new PropertyDsp(st.dataviewType, "byteLength", st.numberType),
    "byteOffset":   new PropertyDsp(st.dataviewType, "byteOffset", st.numberType),
    "__proto__":    new PropertyDsp(st.dataviewType, "__proto__", st.prototypeTypes.DataView),
};

export const DataViewFunctionDsps = {
    "getInt8":      new FunctionDsp(st.dataviewType, "getInt8", new ArgsType([new ArgType(st.numberType), new ArgType(st.numberType, false, true)]), st.numberType),
    "getUint8":     new FunctionDsp(st.dataviewType, "getUint8", new ArgsType([new ArgType(st.numberType), new ArgType(st.numberType, false, true)]), st.numberType),
    "getInt16":     new FunctionDsp(st.dataviewType, "getInt16", new ArgsType([new ArgType(st.numberType), new ArgType(st.numberType, false, true)]), st.numberType),
    "getUint16":    new FunctionDsp(st.dataviewType, "getUint16", new ArgsType([new ArgType(st.numberType), new ArgType(st.numberType, false, true)]), st.numberType),
    "getInt32":     new FunctionDsp(st.dataviewType, "getInt32", new ArgsType([new ArgType(st.numberType), new ArgType(st.numberType, false, true)]), st.numberType),
    "getUint32":    new FunctionDsp(st.dataviewType, "getUint32", new ArgsType([new ArgType(st.numberType), new ArgType(st.numberType, false, true)]), st.numberType),
    "getFloat32":   new FunctionDsp(st.dataviewType, "getFloat32", new ArgsType([new ArgType(st.numberType), new ArgType(st.numberType, false, true)]), st.numberType),
    "getFloat64":   new FunctionDsp(st.dataviewType, "getFloat64", new ArgsType([new ArgType(st.numberType), new ArgType(st.numberType, false, true)]), st.numberType),
    "setInt8":      new FunctionDsp(st.dataviewType, "setInt8", new ArgsType([new ArgType(st.numberType), new ArgType(st.numberType), new ArgType(st.numberType, false, true)]), st.undefinedType),
    "setUint8":     new FunctionDsp(st.dataviewType, "setUint8", new ArgsType([new ArgType(st.numberType), new ArgType(st.numberType), new ArgType(st.numberType, false, true)]), st.undefinedType),
    "setInt16":     new FunctionDsp(st.dataviewType, "setInt16", new ArgsType([new ArgType(st.numberType), new ArgType(st.numberType), new ArgType(st.numberType, false, true)]), st.undefinedType),
    "setUint16":    new FunctionDsp(st.dataviewType, "setUint16", new ArgsType([new ArgType(st.numberType), new ArgType(st.numberType), new ArgType(st.numberType, false, true)]), st.undefinedType),
    "setInt32":     new FunctionDsp(st.dataviewType, "setInt32", new ArgsType([new ArgType(st.numberType), new ArgType(st.numberType), new ArgType(st.numberType, false, true)]), st.undefinedType),
    "setUint32":    new FunctionDsp(st.dataviewType, "setUint32", new ArgsType([new ArgType(st.numberType), new ArgType(st.numberType), new ArgType(st.numberType, false, true)]), st.undefinedType),
    "setFloat32":   new FunctionDsp(st.dataviewType, "setFloat32", new ArgsType([new ArgType(st.numberType), new ArgType(st.numberType), new ArgType(st.numberType, false, true)]), st.undefinedType),
    "setFloat64":   new FunctionDsp(st.dataviewType, "setFloat64", new ArgsType([new ArgType(st.numberType), new ArgType(st.numberType), new ArgType(st.numberType, false, true)]), st.undefinedType),
};

// **************************************************************************************
//
// Function Specification
//
// *************************************************************************************
export const FunctionConstructorPropertyDsps = {
    "prototype": new PropertyDsp(st.constructorTypes.Function, "prototype", st.prototypeTypes.Function),
};

export const FunctionPropertyDsps = {
    "arguments":   new PropertyDsp(st.functionType, "arguments", st.argumentsType),
    "caller":   new PropertyDsp(st.functionType, "caller", st.functionType),
    "length":   new PropertyDsp(st.functionType, "length", st.numberType),
    "name":   new PropertyDsp(st.functionType, "name", st.stringType),
    "constructor":  new PropertyDsp(st.functionType, "constructor", st.constructorTypes.Function), 
    "__proto__":    new PropertyDsp(st.functionType, "__proto__", st.prototypeTypes.Function),
};

export const FunctionFunctionDsps = {
    "apply": new FunctionDsp(st.functionType, "apply", new ArgsType([
                new ArgType(st.functionType, false, true), new ArgType(st.arrayType, false, true),
            ]), st.anyType),
    "bind": new FunctionDsp(st.functionType, "bind", new ArgsType([
                new ArgType(st.objectType, false, false)
            ]), st.functionType),
    "call": new FunctionDsp(st.functionType, "call", new ArgsType([
                new ArgType(st.functionType, false, true), new ArgType(st.anyType, true, true),
            ]), st.anyType),
};

// **************************************************************************************
//
// Object Specification
//
// *************************************************************************************
export const ObjectConstructorPropertyDsps = {
    "prototype": new PropertyDsp(st.constructorTypes.Object, "prototype", st.prototypeTypes.Object),
    "length":   new PropertyDsp(st.constructorTypes.Object, "length", st.numberType),
};

export const ObjectConstructorFunctionDsps = {
    "assign": new FunctionDsp(st.constructorTypes.Object, "assign", new ArgsType([
                new ArgType(st.objectType), new ArgType(st.objectType, true, false),
            ]), st.objectType),
    "create": new FunctionDsp(st.constructorTypes.Object, "create", new ArgsType([
                new ArgType(st.objectType), new ArgType(st.objectType, false, true),
            ]), st.objectType),
    "defineProperty": new FunctionDsp(st.constructorTypes.Object, "defineProperty", new ArgsType([
                new ArgType(st.objectType), 
                new ArgType(new MixedType([
                    st.numberType, st.stringType, st.symbolType
                ])), 
                new ArgType(st.propertyType),
            ]), st.objectType),
    // "defineProperties": new FunctionDsp(st.constructorTypes.Object, "defineProperties", new ArgsType([
    //            new ArgType(st.objectType), new ArgType(st.propertyType),
    //        ]), st.objectType),
    "freeze": new FunctionDsp(st.constructorTypes.Object, "freeze", new ArgsType([
                new ArgType(st.objectType)
            ]), st.objectType),
    "getOwnPropertyDescriptor": new FunctionDsp(st.constructorTypes.Object, "getOwnPropertyDescriptor", new ArgsType([
                new ArgType(st.objectType), new ArgType(new MixedType([st.stringType, st.symbolType]))
            ]), st.objectType),
    "getOwnPropertyNames": new FunctionDsp(st.constructorTypes.Object, "getOwnPropertyNames", new ArgsType([
                new ArgType(st.objectType)
            ]), st.stringArrayType),
    "getOwnPropertySymbols": new FunctionDsp(st.constructorTypes.Object, "getOwnPropertySymbols", new ArgsType([
                new ArgType(st.objectType)
            ]), st.arrayType),
    "getPrototypeOf": new FunctionDsp(st.constructorTypes.Object, "getPrototypeOf", new ArgsType([
                new ArgType(st.objectType)
            ]), st.prototypeType),
    "isExtensible": new FunctionDsp(st.constructorTypes.Object, "isExtensible", new ArgsType([
                new ArgType(st.objectType)
            ]), st.booleanType),
    "isFrozen": new FunctionDsp(st.constructorTypes.Object, "isFrozen", new ArgsType([
                new ArgType(st.objectType)
            ]), st.booleanType),
    "isSealed": new FunctionDsp(st.constructorTypes.Object, "isSealed", new ArgsType([
                new ArgType(st.objectType)
            ]), st.booleanType),
    "keys": new FunctionDsp(st.constructorTypes.Object, "keys", new ArgsType([
                new ArgType(st.objectType)
            ]), st.stringArrayType),
    "preventExtensions": new FunctionDsp(st.constructorTypes.Object, "preventExtensions", new ArgsType([
                new ArgType(st.objectType)
            ]), st.objectType),
    "seal": new FunctionDsp(st.constructorTypes.Object, "seal", new ArgsType([
                new ArgType(st.objectType)
            ]), st.objectType),
    "setPrototypeOf": new FunctionDsp(st.constructorTypes.Object, "setPrototypeOf", new ArgsType([
                new ArgType(st.objectType), new ArgType(new MixedType([st.objectType, st.nullType]))
            ]), st.objectType),
    "values": new FunctionDsp(st.constructorTypes.Object, "values", new ArgsType([
                new ArgType(st.objectType)
            ]), st.arrayType),
};

export const ObjectPropertyDsps = {
    "constructor":  new PropertyDsp(st.objectType, "constructor", st.constructorTypes.Object), 
    "__proto__":    new PropertyDsp(st.objectType, "__proto__", st.prototypeTypes.Object),
};

export const ObjectFunctionDsps = {
    "__defineGetter__": new FunctionDsp(st.objectType, "__defineGetter__", new ArgsType([
                new ArgType(st.stringType), 
                new ArgType(new FunctionExpressionType(new ArgsType(), st.anyType)),
            ]), st.undefinedType),
    "__defineSetter__": new FunctionDsp(st.objectType, "__defineSetter__", new ArgsType([
                new ArgType(st.stringType), 
                new ArgType(new FunctionExpressionType(new ArgsType([new ArgType(st.anyType)]), st.anyType)),
            ]), st.undefinedType),
    // "__lookupGetter__": new FunctionDsp(st.objectType, "__lookupGetter__", new ArgsType([
    //            new ArgType(st.stringType, false, false)
    //        ]), st.functionType),
    // "__lookupSetter__": new FunctionDsp(st.objectType, "__lookupSetter__", new ArgsType([
    //            new ArgType(st.stringType, false, false)
    //        ]), st.functionType),
    "hasOwnProperty": new FunctionDsp(st.objectType, "hasOwnProperty", new ArgsType([
                new ArgType(st.stringType)
            ]), st.booleanType),
    "isPrototypeOf": new FunctionDsp(st.objectType, "isPrototypeOf", new ArgsType([
                new ArgType(st.objectType)
            ]), st.booleanType),
    "propertyIsEnumerable": new FunctionDsp(st.objectType, "propertyIsEnumerable", new ArgsType([
                new ArgType(st.stringType)
            ]), st.booleanType),
    // XXX : need special string for arg
    //"toLocaleString": new FunctionDsp(st.objectType, "toLocaleString", new ArgsType([
    //            new ArgType(st.stringType, false, false)
    //        ]), st.stringType),
    "toString": new FunctionDsp(st.objectType, "toString", new ArgsType([]), st.stringType),
    "valueOf": new FunctionDsp(st.objectType, "valueOf", new ArgsType([]), st.anyType),
}

// **************************************************************************************
//
// Boolean Specification 
//
// *************************************************************************************
export const BooleanConstructorPropertyDsps = {
    "prototype": new PropertyDsp(st.constructorTypes.Boolean, "prototype", st.prototypeTypes.Boolean),
    "length": new PropertyDsp(st.constructorTypes.Boolean, "length", st.numberType),
};

export const BooleanConstructorFunctionDsps = {
};

export const BooleanPropertyDsps = {
    "constructor":  new PropertyDsp(st.booleanType, "constructor", st.constructorTypes.Boolean), 
};

export const BooleanFunctionDsps = {
    "toString": new FunctionDsp(st.booleanType, "toString", new ArgsType([]), st.stringType),
    "valueOf": new FunctionDsp(st.booleanType, "valueOf", new ArgsType([]), st.booleanType),
};

// **************************************************************************************
//
// Error Specification 
//
// *************************************************************************************
export const ErrorConstructorPropertyDsps = {
    "prototype": new PropertyDsp(st.constructorTypes.Error, "prototype", st.prototypeTypes.Error),
};

export const ErrorConstructorFunctionDsps = {
};

export const ErrorPropertyDsps = {
    "constructor":  new PropertyDsp(st.errorType, "constructor", st.constructorTypes.Error), 
    "message":  new PropertyDsp(st.errorType, "message", st.stringType), 
    "name":  new PropertyDsp(st.errorType, "name", st.stringType), 
};

export const ErrorFunctionDsps = {
    "toString": new FunctionDsp(st.errorType, "toString", new ArgsType([]), st.stringType),
};

// **************************************************************************************
//
// Promise Specification
//
// *************************************************************************************

export const PromiseConstructorPropertyDsps = {
    "prototype": new PropertyDsp(st.constructorTypes.Promise, "prototype", st.prototypeTypes.Promise),
    "length": new PropertyDsp(st.constructorTypes.Promise, "length", st.numberType),
};

export const PromiseConstructorFunctionDsps = {
    "all":  new FunctionDsp(st.constructorTypes.Promise, "all", new ArgsType([new ArgType(st.iterableType)]), st.promiseType), 
    "race":  new FunctionDsp(st.constructorTypes.Promise, "race", new ArgsType([new ArgType(st.iterableType)]), st.promiseType), 
    "reject":  new FunctionDsp(st.constructorTypes.Promise, "reject", new ArgsType([new ArgType(st.anyType)]), st.promiseType), 
    "resolve":  new FunctionDsp(st.constructorTypes.Promise, "resolve", new ArgsType([new ArgType(st.anyType)]), st.promiseType), 
};

export const PromisePropertyDsps = {
    "constructor":  new PropertyDsp(st.promiseType, "constructor", st.constructorTypes.Promise), 
};

export const PromiseFunctionDsps = {
    "catch": new FunctionDsp(st.promiseType, "catch", new ArgsType([new ArgType(new FunctionExpressionType(new ArgsType([st.argType]), st.anyType))]), st.promiseType),
    "then": new FunctionDsp(st.promiseType, "then", new ArgsType([new ArgType(new FunctionExpressionType(new ArgsType([st.argType]), st.anyType)), new ArgType(new FunctionExpressionType(new ArgsType([st.argType]), st.anyType), false, true)]), st.promiseType),
    "finally": new FunctionDsp(st.promiseType, "finally", new ArgsType([new ArgType(new FunctionExpressionType(new ArgsType([st.argType]), st.anyType))]), st.promiseType),
};

// **************************************************************************************
//
// Symbol Specification
//
// **************************************************************************************
export const SymbolConstructorPropertyDsps = {
    "prototype": new PropertyDsp(st.constructorTypes.Symbol, "prototype", st.prototypeTypes.Symbol),
    "length": new PropertyDsp(st.constructorTypes.Symbol, "length", st.numberType),
    "iterator": new PropertyDsp(st.constructorTypes.Symbol, "iterator", st.iteratorType),
    // TODO (https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/Symbol/asyncIterator)
    //"asyncIterator": new PropertyDsp(st.constructorTypes.Symbol, "asyncIterator", st.iteratorType),
    "match": new PropertyDsp(st.constructorTypes.Symbol, "match", st.symbolType),
    "replace": new PropertyDsp(st.constructorTypes.Symbol, "replace", st.symbolType),
    "search": new PropertyDsp(st.constructorTypes.Symbol, "search", st.symbolType),
    "split": new PropertyDsp(st.constructorTypes.Symbol, "split", st.symbolType),
    "hasInstance": new PropertyDsp(st.constructorTypes.Symbol, "hasInstance", st.symbolType),
    "isConcatSpreadable": new PropertyDsp(st.constructorTypes.Symbol, "isConcatSpreadable", st.symbolType),
    "unscopables": new PropertyDsp(st.constructorTypes.Symbol, "unscopables", st.symbolType),
    "species": new PropertyDsp(st.constructorTypes.Symbol, "species", st.symbolType),
    "toPrimitive": new PropertyDsp(st.constructorTypes.Symbol, "toPrimitive", st.symbolType),
    "toStringTag": new PropertyDsp(st.constructorTypes.Symbol, "toStringTag", st.symbolType),
};

export const SymbolConstructorFunctionDsps = {
    "for":  new FunctionDsp(st.constructorTypes.Symbol, "for", new ArgsType([new ArgType(st.stringType)]), st.symbolType), 
    "keyFor":  new FunctionDsp(st.constructorTypes.Symbol, "keyFor", new ArgsType([new ArgType(st.symbolType)]), st.stringType), 
};

export const SymbolPropertyDsps = {
    "constructor":  new PropertyDsp(st.symbolType, "constructor", st.constructorTypes.Symbol), 
    "description":  new PropertyDsp(st.symbolType, "description", st.stringType), 
};

export const SymbolFunctionDsps = {
    "toString": new FunctionDsp(st.promiseType, "toString", new ArgsType([]), st.stringType),
    "valueOf": new FunctionDsp(st.promiseType, "valueOf", new ArgsType([]), st.symbolType),
};
// **************************************************************************************
//
// GeneratorFunction Specification
//
// *************************************************************************************

// **************************************************************************************
//
// AsyncFunction Specification
//
// **************************************************************************************

// **************************************************************************************
//
// Reflect Specification
//
// **************************************************************************************

export const ReflectPropertyDsps = {
};

export const ReflectFunctionDsps = {
    "getPrototypeOf":new FunctionDsp(st.reflectType,"getPrototypeOf",
    new ArgsType([
        new ArgType(st.objectType)
    ]), st.objectType),
    "setPrototypeOf":new FunctionDsp(st.reflectType, "setPrototypeOf",
    new ArgsType([
        new ArgType(st.objectType),
        new ArgType(st.objectType)
    ]), st.booleanType),
    "isExtensible": new FunctionDsp(st.reflectType, "isExtensible",
    new ArgsType([
        new ArgType(st.objectType)
    ]), st.booleanType),

    "preventExtensions": new FunctionDsp(st.reflectType,"preventExtensions",
    new ArgsType([
        new ArgType(st.objectType)
    ]), st.booleanType),

    "getOwnPropertyDescriptor": new FunctionDsp(st.reflectType,"getOwnPropertyDescriptor",
    new ArgsType([
        new ArgType(st.objectType),
        new ArgType(new MixedType([
            st.numberType, st.stringType, st.symbolType
        ]))
    ]), st.objectType),
    "defineProperty": new FunctionDsp(st.reflectType, "defineProperty",
    new ArgsType([
        new ArgType(st.objectType),
        new ArgType(new MixedType([
            st.numberType, st.stringType, st.symbolType
        ])),
        new ArgType(st.propertyType, false, true),
    ]), st.booleanType),
    "has": new FunctionDsp(st.reflectType, "has",
    new ArgsType([
        new ArgType(st.objectType),
        new ArgType(new MixedType([
            st.numberType, st.stringType, st.symbolType
        ])),
    ]), st.booleanType),
    "get": new FunctionDsp(st.reflectType, "get",
    new ArgsType([
        new ArgType(st.objectType),
        new ArgType(new MixedType([
            st.numberType, st.stringType, st.symbolType
        ])),
        new ArgType(new MixedType([
            st.objectType, st.proxyType
        ])),
    ]), st.anyType),
    "set": new FunctionDsp(st.reflectType, "set", 
    new ArgsType([
        new ArgType(st.objectType),
        new ArgType(new MixedType([
            st.numberType, st.stringType, st.symbolType
        ])),
        new ArgType(st.anyType),
        new ArgType(new MixedType([
            st.objectType, st.proxyType
        ])),
    ]), st.booleanType),
    "deleteProperty": new FunctionDsp(st.reflectType, "deleteProperty",
    new ArgsType([
        new ArgType(st.objectType),
        new ArgType(new MixedType([
            st.numberType, st.stringType, st.symbolType
        ])),
    ]), st.booleanType),
    "ownKeys": new FunctionDsp(st.reflectType, "ownKeys", 
    new ArgsType([
        new ArgType(st.objectType),
    ]), st.stringArrayType),
    "apply": new FunctionDsp(st.reflectType, "apply",
    new ArgsType([
        new ArgType(st.objectType),
        new ArgType(st.objectType),
        new ArgType(st.arrayType),
    ]), st.anyType),
    "construct": new FunctionDsp(st.reflectType, "construct",
    new ArgsType([
        new ArgType(st.objectType),
        new ArgType(st.arrayType),
        new ArgType(st.objectType, false, true),
    ]), st.objectType)
};

// **************************************************************************************
//
// JSON Specification
//
// **************************************************************************************

// **************************************************************************************
//
// Proxy Specification
//
// **************************************************************************************

export const ProxyConstructorPropertyDsps = {
};

export const ProxyConstructorFunctionDsps = {
    "revocable":  new FunctionDsp(st.constructorTypes.Proxy, "revocable", 
    new ArgsType([
        new ArgType(st.objectType),
        new ArgType(st.proxyhandlerType),
    ]), 
    st.promiseType), 
};

export const ProxyPropertyDsps = {
};

export const ProxyFunctionDsps = {
};

// **************************************************************************************
//
// Iterator Specification
//
// **************************************************************************************

// TODO: iterator type
export const IteratorFunctionDsps = {
    "next": new FunctionDsp(st.iteratorType, "next", new ArgsType([]), new ObjectType([{w:1, v:new 
                                                                                      Pair("value", st.anyType)}])),
};

// **************************************************************************************
//
// Intl Specification
//
// **************************************************************************************

// **************************************************************************************
//
// arguments Specification
//
// **************************************************************************************

// **************************************************************************************
//
// Property Name Specification
//
// **************************************************************************************
