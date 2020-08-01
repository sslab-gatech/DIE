import { VariableDsps, LiteralDsps, BinaryExpressionDsps, LogicalExpressionDsps, UnaryExpressionDsps, UpdateExpressionDsps, NewExpressionDsps, MemberExpressionDsps, ArrayExpressionDsps, ObjectExpressionDsps, NumberConstructorPropertyDsps, NumberConstructorFunctionDsps, NumberFunctionDsps, MathPropertyDsps, MathFunctionDsps, DateConstructorPropertyDsps, DateConstructorFunctionDsps, DatePropertyDsps, DateFunctionDsps, StringConstructorFunctionDsps, StringPropertyDsps, StringFunctionDsps, RegExpConstructorPropertyDsps, RegExpPropertyDsps, RegExpFunctionDsps, ArrayConstructorFunctionDsps, ArrayPropertyDsps, ArrayFunctionDsps, TypedArrayConstructorPropertyDsps, TypedArrayConstructorFunctionDsps, TypedArrayPropertyDsps, MapPropertyDsps, TypedArrayFunctionDsps, MapFunctionDsps, SetFunctionDsps, WeakMapPropertyDsps, WeakMapFunctionDsps, WeakSetFunctionDsps, ArrayBufferConstructorFunctionDsps, ArrayBufferPropertyDsps, ArrayBufferFunctionDsps, DataViewPropertyDsps, DataViewFunctionDsps, FunctionPropertyDsps, FunctionFunctionDsps, ObjectConstructorFunctionDsps, ObjectConstructorPropertyDsps, ObjectPropertyDsps, ObjectFunctionDsps, IteratorFunctionDsps, MapConstructorPropertyDsps, SetPropertyDsps, SetConstructorPropertyDsps, WeakMapConstructorPropertyDsps, WeakSetConstructorPropertyDsps, WeakSetPropertyDsps, ArrayBufferConstructorPropertyDsps, DataViewConstructorPropertyDsps, FunctionConstructorPropertyDsps } from "./esspecs";

export type Weight<T> = { ['w']: number, ['v']: T };

function _Weight<T>(arr: Array<Weight<T>>): Array<Weight<T>> {
    return arr;
}

export var VariableWeight: Array<Weight<keyof (typeof VariableDsps)>> = [
    { w: 1, v: "var" },
];

export var LiteralWeight: Array<Weight<keyof (typeof LiteralDsps)>> = [
    { w: 1, v: "Boolean" },
    { w: 1, v: "String" },
    { w: 1, v: "Number" },
    { w: 1, v: "Null" },
    { w: 1, v: "RegExp" },
    { w: 1, v: "Math" },
];

export var BinaryExpressionWeight: Array<Weight<keyof (typeof BinaryExpressionDsps)>> = [
    { w: 1, v: "+" },
    { w: 1, v: "-" },
    { w: 1, v: "/" },
    { w: 1, v: "%" },
    { w: 1, v: "*" },
    { w: 1, v: "**" },
    { w: 1, v: "&" },
    { w: 1, v: "|" },
    { w: 1, v: ">>" },
    { w: 1, v: ">>>" },
    { w: 1, v: "<<" },
    { w: 1, v: "^" },
    { w: 1, v: "==" },
    { w: 1, v: "===" },
    { w: 1, v: "!=" },
    { w: 1, v: "!==" },
    { w: 1, v: ">=" },
    { w: 1, v: "<=" },
    { w: 1, v: ">" },
    { w: 1, v: "<" },
    { w: 1, v: "in" },
    { w: 1, v: "instanceof" },
];

export var LogicalExpressionWeight: Array<Weight<keyof typeof LogicalExpressionDsps>> = [
    { w: 1, v: "&&" },
    { w: 1, v: "||" }
];

export var UnaryExpressionWeight: Array<Weight<keyof typeof UnaryExpressionDsps>> = [
    { w: 1, v: "void" },
    { w: 1, v: "delete" },
    { w: 0, v: "throw" },
    { w: 1, v: "!" },
    { w: 1, v: "+" },
    { w: 1, v: "-" },
    { w: 1, v: "~" },
    { w: 1, v: "typeof" },
];

export var UpdateExpressionWeight: Array<Weight<keyof typeof UpdateExpressionDsps>> = [
    { w: 1, v: "++" },
    { w: 1, v: "--" },
];


export var NewExpressionWeight: Array<Weight<keyof typeof NewExpressionDsps>> = [
    { w: 1, v: "Array" },
    { w: 1, v: "ArrayBuffer" },
    { w: 1, v: "SharedArrayBuffer" },
    { w: 1, v: "DataView" },
    { w: 1, v: "Date" },
    { w: 1, v: "Error" },
    { w: 1, v: "Int8Array" },
    { w: 1, v: "Uint8Array" },
    { w: 1, v: "Uint8ClampedArray" },
    { w: 1, v: "Int16Array" },
    { w: 1, v: "Uint16Array" },
    { w: 1, v: "Int32Array" },
    { w: 1, v: "Uint32Array" },
    { w: 1, v: "Float32Array" },
    { w: 1, v: "Float64Array" },
    { w: 1, v: "Map" },
    { w: 1, v: "WeakMap" },
    { w: 1, v: "Set" },
    { w: 1, v: "WeakSet" },
    { w: 1, v: "Object" },
    { w: 1, v: "Promise" },
    { w: 1, v: "Proxy" },
    { w: 1, v: "RegExp" },
    // TODO: We ignore String, Boolean, Number here now.
];

export var MemberExpressionWeight: Array<Weight<keyof typeof MemberExpressionDsps>> = [
    { w: 1, v: "array" },
    { w: 1, v: "typedarray" },
    { w: 1, v: "object" },
];
export var ArrayExpressionWeight: Array<Weight<keyof typeof ArrayExpressionDsps>> = [
    { w: 1, v: "Any" },
    { w: 1, v: "Number" },
];

export var NumberConstructorPropertyWeight: Array<Weight<keyof typeof NumberConstructorPropertyDsps>> = [
    { w: 1, v: "prototype" },
    { w: 1, v: "EPSILON" },
    { w: 1, v: "MAX_SAFE_INTEGER" },
    { w: 1, v: "MAX_VALUE" },
    { w: 1, v: "MIN_SAFE_INTEGER" },
    { w: 1, v: "MIN_VALUE" },
    { w: 1, v: "NaN" },
    { w: 1, v: "NEGATIVE_INFINITY" },
    { w: 1, v: "POSITIVE_INFINITY" },
];
export var NumberConstructorFunctionWeight: Array<Weight<keyof typeof NumberConstructorFunctionDsps>> = [
    { w: 1, v: "isNaN" },
    { w: 1, v: "isFinite" },
    { w: 1, v: "isInteger" },
    { w: 1, v: "isSafeInteger" },
    { w: 1, v: "parseFloat" },
    { w: 1, v: "parseInt" },
];
export var NumberFunctionWeight: Array<Weight<keyof typeof NumberFunctionDsps>> = [
    { w: 1, v: "toExponential" },
    { w: 1, v: "toFixed" },
    { w: 1, v: "toLocaleString" },
    { w: 1, v: "toPrecision" },
    { w: 1, v: "toString" },
    { w: 1, v: "valueOf" },
];

export var MathPropertyWeight: Array<Weight<keyof typeof MathPropertyDsps>> =
    [
        { w: 1, v: "E" },
        { w: 1, v: "LN2" },
        { w: 1, v: "LN10" },
        { w: 1, v: "LOG2E" },
        { w: 1, v: "LOG10E" },
        { w: 1, v: "PI" },
        { w: 1, v: "SQRT1_2" },
        { w: 1, v: "SQRT2" },
    ];
export var MathFunctionWeight: Array<Weight<keyof typeof MathFunctionDsps>> =
    [
        { w: 1, v: "abs" },
        { w: 1, v: "acos" },
        { w: 1, v: "acosh" },
        { w: 1, v: "asin" },
        { w: 1, v: "asinh" },
        { w: 1, v: "atan" },
        { w: 1, v: "atanh" },
        { w: 1, v: "atan2" },
        { w: 1, v: "cbrt" },
        { w: 1, v: "ceil" },
        { w: 1, v: "clz32" },
        { w: 1, v: "cos" },
        { w: 1, v: "cosh" },
        { w: 1, v: "exp" },
        { w: 1, v: "expm1" },
        { w: 1, v: "floor" },
        { w: 1, v: "fround" },
        { w: 1, v: "hypot" },
        { w: 1, v: "imul" },
        { w: 1, v: "log" },
        { w: 1, v: "log1p" },
        { w: 1, v: "log10" },
        { w: 1, v: "log2" },
        { w: 1, v: "max" },
        { w: 1, v: "min" },
        { w: 1, v: "pow" },
        { w: 1, v: "random" },
        { w: 1, v: "round" },
        { w: 1, v: "sign" },
        { w: 1, v: "sin" },
        { w: 1, v: "sinh" },
        { w: 1, v: "sqrt" },
        { w: 1, v: "tan" },
        { w: 1, v: "tanh" },
        { w: 1, v: "trunc" },
    ];
export var DateConstructorPropertyWeight: Array<Weight<keyof typeof DateConstructorPropertyDsps>> =
    [
        { w: 1, v: "prototype" }
    ]
export var DateConstructorFunctionWeight: Array<Weight<keyof typeof DateConstructorFunctionDsps>> =
    [
        { w: 1, v: "now" },
        { w: 1, v: "parse" },
        { w: 1, v: "UTC" },
    ]
export var DatePropertyWeight: Array<Weight<keyof typeof DatePropertyDsps>> =
    [
        { w: 1, v: "__proto__" },
    ]
export var DateFunctionWeight: Array<Weight<keyof typeof DateFunctionDsps>> =
    [
        { w: 1, v: "getDate" },
        { w: 1, v: "getDay" },
        { w: 1, v: "getFullYear" },
        { w: 1, v: "getHours" },
        { w: 1, v: "getMilliseconds" },
        { w: 1, v: "getMinutes" },
        { w: 1, v: "getMonth" },
        { w: 1, v: "getSeconds" },
        { w: 1, v: "getTime" },
        { w: 1, v: "getTimezoneOffset" },
        { w: 1, v: "getUTCDate" },
        { w: 1, v: "getUTCDay" },
        { w: 1, v: "getUTCFullYear" },
        { w: 1, v: "getUTCHours" },
        { w: 1, v: "getUTCMilliseconds" },
        { w: 1, v: "getUTCMinutes" },
        { w: 1, v: "getUTCMonth" },
        { w: 1, v: "getUTCSeconds" },
        { w: 1, v: "getYear" },
        { w: 1, v: "setDate" },
        { w: 1, v: "setFullYear" },
        { w: 1, v: "setHours" },
        { w: 1, v: "setMilliseconds" },
        { w: 1, v: "setMinutes" },
        { w: 1, v: "setMonth" },
        { w: 1, v: "setSeconds" },
        { w: 1, v: "setTime" },
        { w: 1, v: "setUTCDate" },
        { w: 1, v: "setUTCFullYear" },
        { w: 1, v: "setUTCHours" },
        { w: 1, v: "setUTCMilliseconds" },
        { w: 1, v: "setUTCMinutes" },
        { w: 1, v: "setUTCMonth" },
        { w: 1, v: "setUTCSeconds" },
        { w: 1, v: "setYear" },
        { w: 1, v: "toDateString" },
        { w: 1, v: "toISOString" },
        { w: 1, v: "toJSON" },
        { w: 1, v: "toGMTString" },
        { w: 1, v: "toLocaleDateString" },
        { w: 1, v: "toLocaleFormat" },
        { w: 1, v: "toLocaleString" },
        { w: 1, v: "toLocaleTimeString" },
        { w: 1, v: "toSource" },
        { w: 1, v: "toString" },
        { w: 1, v: "toTimeString" },
        { w: 1, v: "toUTILSCString" },
        { w: 1, v: "valueOf" },
    ];
export var StringConstructorFunctionWeight: Array<Weight<keyof typeof StringConstructorFunctionDsps>> = [
    { w: 1, v: "fromCharCode" },
    { w: 1, v: "fromCodePoint" },
]
export var StringPropertyWeight: Array<Weight<keyof typeof StringPropertyDsps>> =
    [
        { w: 1, v: "length" },
        { w: 1, v: "constructor" },
        { w: 1, v: "__proto__" },
    ]
export var StringFunctionWeight: Array<Weight<keyof typeof StringFunctionDsps>> =
    [
        { w: 1, v: "charAt" },
        { w: 1, v: "charCodeAt" },
        { w: 1, v: "codePointAt" },
        { w: 1, v: "concat" },
        { w: 1, v: "includes" },
        { w: 1, v: "endsWith" },
        { w: 1, v: "indexOf" },
        { w: 1, v: "lastIndexOf" },
        { w: 1, v: "localeCompare" },
        { w: 1, v: "match" },
        { w: 1, v: "normalize" },
        { w: 1, v: "padEnd" },
        { w: 1, v: "padStart" },
        { w: 1, v: "repeat" },
        { w: 1, v: "replace" },
        { w: 1, v: "search" },
        { w: 1, v: "slice" },
        { w: 1, v: "split" },
        { w: 1, v: "startsWith" },
        { w: 1, v: "substr" },
        { w: 1, v: "substring" },
        { w: 1, v: "toLocaleLowerCase" },
        { w: 1, v: "toLocaleUpperCase" },
        { w: 1, v: "toLowerCase" },
        { w: 1, v: "toString" },
        { w: 1, v: "toUpperCase" },
        { w: 1, v: "trim" },
        { w: 1, v: "trimLeft" },
        { w: 1, v: "trimRight" },
        { w: 1, v: "valueOf" },

    ]
export var RegExpConstructorPropertyWeight: Array<Weight<keyof typeof RegExpConstructorPropertyDsps>> =
    [
        { w: 1, v: "prototype" },
        { w: 1, v: "$1" },
        { w: 1, v: "$2" },
        { w: 1, v: "$3" },
        { w: 1, v: "$4" },
        { w: 1, v: "$5" },
        { w: 1, v: "$6" },
        { w: 1, v: "$7" },
        { w: 1, v: "$8" },
        { w: 1, v: "$9" },
        { w: 1, v: "$_" },
        // {w: 1, v: "[\"$*\"]"},
        // {w: 1, v: "[\"$&\"]"},
        // {w: 1, v: "[\"$+\"]"},
        // {w: 1, v: "[\"$`\"]"},
        // {w: 1, v: "[\"$'\"]"},
        { w: 1, v: "input" },
        { w: 1, v: "lastMatch" },
        { w: 1, v: "lastParen" },
        { w: 1, v: "leftContext" },
        { w: 1, v: "rightContext" },
    ];
export var RegExpPropertyWeight: Array<Weight<keyof typeof RegExpPropertyDsps>> =
    [
        { w: 1, v: "flags" },
        { w: 1, v: "global" },
        { w: 1, v: "source" },
        { w: 1, v: "ignoreCase" },
        { w: 1, v: "multiline" },
        { w: 1, v: "sticky" },
        { w: 1, v: "unicode" },
        { w: 1, v: "lastIndex" },
        { w: 1, v: "__proto__" },
    ]
export var RegExpFunctionWeight: Array<Weight<keyof typeof RegExpFunctionDsps>> =
    [
        { w: 1, v: "compile" },
        { w: 1, v: "exec" },
        { w: 1, v: "test" },
        { w: 1, v: "toString" }
    ];
export var ArrayConstructorFunctionWeight: Array<Weight<keyof typeof ArrayConstructorFunctionDsps>> =
    [
        { w: 1, v: "from" },
        { w: 1, v: "isArray" },
        // { w: 1, v: "observe" },
        { w: 1, v: "of" }
    ]
export var ArrayPropertyWeight: Array<Weight<keyof typeof ArrayPropertyDsps>> =
    [
        { w: 1, v: "length" },
        { w: 1, v: "constructor" },
        { w: 1, v: "__proto__" },
    ];
export var ArrayFunctionWeight: Array<Weight<keyof typeof ArrayFunctionDsps>> =
    [
        { w: 1, v: "copyWithin" },
        { w: 1, v: "fill" },
        { w: 1, v: "pop" },
        { w: 1, v: "push" },
        { w: 1, v: "reverse" },
        { w: 1, v: "shift" },
        { w: 1, v: "sort" },
        { w: 1, v: "splice" },
        { w: 1, v: "unshift" },
        { w: 1, v: "concat" },
        { w: 1, v: "includes" },
        { w: 1, v: "join" },
        { w: 1, v: "slice" },
        { w: 1, v: "toSource" },
        { w: 1, v: "toString" },
        { w: 1, v: "toLocaleString" },
        { w: 1, v: "indexOf" },
        { w: 1, v: "lastIndexOf" },
        { w: 1, v: "entries" },
        { w: 1, v: "every" },
        { w: 1, v: "filter" },
        { w: 1, v: "find" },
        { w: 1, v: "findIndex" },
        { w: 1, v: "forEach" },
        { w: 1, v: "keys" },
        { w: 1, v: "map" },
        { w: 1, v: "reduce" },
        { w: 1, v: "reduceRight" },
        { w: 1, v: "some" },
        { w: 1, v: "values" },
    ]
export var TypedArrayConstructorPropertyWeight: Array<Weight<keyof typeof TypedArrayConstructorPropertyDsps>> =
    [
        { w: 1, v: "prototype" },
        { w: 1, v: "BYTES_PER_ELEMENT" },
        { w: 1, v: "name" },
    ]
export var TypedArrayConstructorFunctionWeight: Array<Weight<keyof typeof TypedArrayConstructorFunctionDsps>> =
    [
        { w: 1, v: "from" },
        { w: 1, v: "of" },
    ]
export var TypedArrayProepertyWeight: Array<Weight<keyof typeof TypedArrayPropertyDsps>> =
    [
        { w: 1, v: "length" },
        { w: 1, v: "constructor" },
        { w: 1, v: "buffer" },
        { w: 1, v: "byteLength" },
        { w: 1, v: "byteOffset" },
        { w: 1, v: "__proto__" },
    ]
export var TypedArrayFunctionWeight: Array<Weight<keyof typeof TypedArrayFunctionDsps>> =
    [
        { w: 1, v: "copyWithin" },
        { w: 1, v: "entries" },
        { w: 1, v: "every" },
        { w: 1, v: "fill" },
        { w: 1, v: "filter" },
        { w: 1, v: "find" },
        { w: 1, v: "findIndex" },
        { w: 1, v: "forEach" },
        { w: 1, v: "includes" },
        { w: 1, v: "indexOf" },
        { w: 1, v: "join" },
        { w: 1, v: "keys" },
        { w: 1, v: "lastIndexOf" },
        { w: 1, v: "map" },
        { w: 1, v: "reduce" },
        { w: 1, v: "reduceRight" },
        { w: 1, v: "reverse" },
        { w: 1, v: "set" },
        { w: 1, v: "slice" },
        { w: 1, v: "some" },
        { w: 1, v: "sort" },
        { w: 1, v: "subArray" },
        { w: 1, v: "values" },
        { w: 1, v: "toLocaleString" },
        { w: 1, v: "toString" },
    ]

export var MapConstructorPropertyWeight: Array<Weight<keyof typeof MapConstructorPropertyDsps>> =
    [
        { w: 1, v: "prototype" },
    ]

export var MapPropertyWeight: Array<Weight<keyof typeof MapPropertyDsps>> =
    [
        { w: 1, v: "size" },
        { w: 1, v: "constructor" },
        { w: 1, v: "__proto__" },
    ]

export var MapFunctionWeight: Array<Weight<keyof typeof MapFunctionDsps>> =
    [
        { w: 1, v: "clear" },
        { w: 1, v: "delete" },
        { w: 1, v: "entries" },
        { w: 1, v: "forEach" },
        { w: 1, v: "get" },
        { w: 1, v: "has" },
        { w: 1, v: "keys" },
        { w: 1, v: "set" },
        { w: 1, v: "values" },
    ]

export var SetConstructorPropertyWeight: Array<Weight<keyof typeof SetConstructorPropertyDsps>> =
    [
        { w: 1, v: "prototype" },
    ]

export var SetPropertyWeight: Array<Weight<keyof typeof SetPropertyDsps>> =
    [
        { w: 1, v: "size" },
        { w: 1, v: "constructor" },
        { w: 1, v: "__proto__" },
    ]

export var SetFunctionWeight: Array<Weight<keyof typeof SetFunctionDsps>> =
    [
        { w: 1, v: "add" },
        { w: 1, v: "clear" },
        { w: 1, v: "delete" },
        { w: 1, v: "entries" },
        { w: 1, v: "forEach" },
        { w: 1, v: "has" },
        { w: 1, v: "keys" },
        { w: 1, v: "values" }
    ]

export var WeakMapConstructorPropertyWeight: Array<Weight<keyof typeof WeakMapConstructorPropertyDsps>> =
    [
        { w: 1, v: "prototype" },
    ]

export var WeakMapPropertyWeight: Array<Weight<keyof typeof WeakMapPropertyDsps>> =
    [
        { w: 1, v: "constructor" },
        { w: 1, v: "__proto__" },
    ]
export var WeakMapFunctionWeight: Array<Weight<keyof typeof WeakMapFunctionDsps>> =
    [
        { w: 1, v: "delete" },
        { w: 1, v: "has" },
        { w: 1, v: "get" },
        { w: 1, v: "set" }
    ]

export var WeakSetConstructorPropertyWeight: Array<Weight<keyof typeof WeakSetConstructorPropertyDsps>> =
    [
        { w: 1, v: "prototype" },
    ]

export var WeakSetPropertyWeight: Array<Weight<keyof typeof WeakSetPropertyDsps>> =
    [
        { w: 1, v: "constructor" },
        { w: 1, v: "__proto__" },
    ]

export var WeakSetFunctionWeight: Array<Weight<keyof typeof WeakSetFunctionDsps>> =
    [
        { w: 1, v: "delete" },
        { w: 1, v: "has" },
        { w: 1, v: "add" },
    ]

export var ArrayBufferConstructorPropertyWeight: Array<Weight<keyof typeof ArrayBufferConstructorPropertyDsps>> =
    [
        { w: 1, v: "prototype" },
    ]

export var ArrayBufferConstructorFunctionWeight: Array<Weight<keyof typeof ArrayBufferConstructorFunctionDsps>> =
    [
        { w: 1, v: "isView" },
        { w: 1, v: "transfer" },
    ]
export var ArrayBufferPropertyWeight: Array<Weight<keyof typeof ArrayBufferPropertyDsps>> =
    [
        { w: 1, v: "constructor" },
        { w: 1, v: "byteLength" },
        { w: 1, v: "__proto__" },
    ]
export var ArrayBufferFunctionWeight: Array<Weight<keyof typeof ArrayBufferFunctionDsps>> =
    [
        { w: 1, v: "slice" },
    ]

export var DataViewConstructorPropertyWeight: Array<Weight<keyof typeof DataViewConstructorPropertyDsps>> =
    [
        { w: 1, v: "prototype" },
    ]

export var DataViewPropertyWeight: Array<Weight<keyof typeof DataViewPropertyDsps>> =
    [
        { w: 1, v: "constructor" },
        { w: 1, v: "buffer" },
        { w: 1, v: "byteLength" },
        { w: 1, v: "byteOffset" },
        { w: 1, v: "__proto__" },
    ]
export var DataViewFunctionWeight: Array<Weight<keyof typeof DataViewFunctionDsps>> =
    [
        { w: 1, v: "getInt8" },
        { w: 1, v: "getUint8" },
        { w: 1, v: "getInt16" },
        { w: 1, v: "getUint16" },
        { w: 1, v: "getInt32" },
        { w: 1, v: "getUint32" },
        { w: 1, v: "getFloat32" },
        { w: 1, v: "getFloat64" },
        { w: 1, v: "setInt8" },
        { w: 1, v: "setUint8" },
        { w: 1, v: "setInt16" },
        { w: 1, v: "setUint16" },
        { w: 1, v: "setInt32" },
        { w: 1, v: "setUint32" },
        { w: 1, v: "setFloat32" },
        { w: 1, v: "setFloat64" },
    ]

export var FunctionConstructorPropertyWeight: Array<Weight<keyof typeof FunctionConstructorPropertyDsps>> =
    [
        { w: 1, v: "prototype" },
    ]

export var FunctionPropertyWeight: Array<Weight<keyof typeof FunctionPropertyDsps>> =
    [
        { w: 1, v: "arguments" },
        { w: 1, v: "caller" },
        { w: 1, v: "length" },
        { w: 1, v: "name" },
        { w: 1, v: "constructor" },
        { w: 1, v: "__proto__" },
    ];
export var FunctionFunctionWeight: Array<Weight<keyof typeof FunctionFunctionDsps>> =
    [
        { w: 1, v: "apply" },
        { w: 1, v: "bind" },
        { w: 1, v: "call" },
    ]
export var ObjectConstructorPropertyWeight: Array<Weight<keyof typeof ObjectConstructorPropertyDsps>> =
    [
        { w: 1, v: "prototype" },
        { w: 1, v: "length" },
    ]
export var ObjectConstructorFunctionWeight: Array<Weight<keyof typeof ObjectConstructorFunctionDsps>> =
    [
        { w: 1, v: "assign" },
        { w: 1, v: "create" },
        { w: 1, v: "defineProperty" },
        // { w: 1, v: "defineProperties" },
        { w: 1, v: "freeze" },
        { w: 1, v: "getOwnPropertyDescriptor" },
        { w: 1, v: "getOwnPropertyNames" },
        { w: 1, v: "getOwnPropertySymbols" },
        { w: 1, v: "getPrototypeOf" },
        { w: 1, v: "isExtensible" },
        { w: 1, v: "isFrozen" },
        { w: 1, v: "isSealed" },
        { w: 1, v: "keys" },
        { w: 1, v: "preventExtensions" },
        { w: 1, v: "seal" },
        { w: 1, v: "setPrototypeOf" },
        { w: 1, v: "values" },
    ]
export var ObjectPropertyWeight: Array<Weight<keyof typeof ObjectPropertyDsps>> =
    [
        { w: 1, v: "constructor" },
        { w: 1, v: "__proto__" },
    ]
export var ObjectFunctionWeight: Array<Weight<keyof typeof ObjectFunctionDsps>> =
    [
        { w: 1, v: "__defineGetter__" },
        { w: 1, v: "__defineSetter__" },
        // { w: 1, v: "__lookupGetter__" },
        // { w: 1, v: "__lookupSetter__" },
        { w: 1, v: "hasOwnProperty" },
        { w: 1, v: "isPrototypeOf" },
        { w: 1, v: "propertyIsEnumerable" },
        { w: 1, v: "toString" },
        { w: 1, v: "valueOf" },
    ]
export var IteratorFunctionWeight: Array<Weight<keyof typeof IteratorFunctionDsps>> =
    [
        { w: 1, v: "next" },
    ]