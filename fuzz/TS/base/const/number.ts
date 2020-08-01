import * as UTILS from "../utils";
const Random = UTILS.Random;

export function index() {
  var specials = Random.weighted([
		{ w: 3, v: "0" },
		{ w: 1, v: "1" },
		{ w: 1, v: "100" }
  ])
  return Random.pick(specials);
}

// Get from JsFunfuzz
export function gen(b : any[] = []) {
	var specials = Random.weighted([
		// Numbers and number-like things
		{ w: 1, v: "0" },
		{ w: 1, v: "1" },
		{ w: 1, v: "2" },
		{ w: 1, v: "3" },
		{ w: 1, v: "0.1" },
		{ w: 1, v: ".2" },
		{ w: 1, v: "1.3" },
		{ w: 1, v: "4." },
		{ w: 1, v: "5.0000000000000000000000" },
		{ w: 1, v: "1.2e3" },
		{ w: 1, v: "1e81" },
		{ w: 1, v: "1e+81" },
		{ w: 1, v: "1e-81" },
		{ w: 1, v: "1e4" },
		{ w: 1, v: "-0" },
		{ w: 1, v: "(-0)" },
		{ w: 1, v: "-1" },
		{ w: 1, v: "(-1)" },
		{ w: 1, v: "0x99" },
		{ w: 1, v: "033" },
		{ w: 1, v: "3/0" },
		{ w: 1, v: "-3/0" },
		{ w: 1, v: "0/0" },
	{ w: 1, v: "Math.PI" },
		{ w: 1, v: "0x2D413CCC"},
		{ w: 1, v: "0x5a827999"},
		{ w: 1, v: "0xB504F332"},
		{ w: 1, v: "-0x2D413CCC"},
		{ w: 1, v: "-0x5a827999"},
		{ w: 1, v: "-0xB504F332"},
		{ w: 1, v: "0x50505050"},
		{ w: 1, v: "(0x50505050 >> 1)"},

		// various powers of two, with values near JSVAL_INT_MAX especially tested
		{ w: 1, v: "0x10000000"},
		{ w: 1, v: "0x20000000"},
		{ w: 1, v: "0x3FFFFFFE"},
		{ w: 1, v: "0x3FFFFFFF"},
		{ w: 1, v: "0x40000000"},
		{ w: 1, v: "0x40000001"},


		// Boundaries
		// Boundaries of int, signed, unsigned (near +/- 2^31, +/- 2^32)
		{ w: 1, v: "0x07fffffff"},
		{ w: 1, v: "0x080000000"},
		{ w: 1, v: "0x080000001"},

		{ w: 1, v: "-0x07fffffff"},
		{ w: 1, v: "-0x080000000"},
		{ w: 1, v: "-0x080000001"},

		{ w: 1, v: "0x0ffffffff"},
		{ w: 1, v: "0x100000000"},
		{ w: 1, v: "0x100000001"},

		{ w: 1, v: "-0x0ffffffff"},
		{ w: 1, v: "-0x100000000"},
		{ w: 1, v: "-0x100000001"},


		// Boundaries of double
		{ w: 1, v: "Number.MIN_VALUE"},
		{ w: 1, v: "-Number.MIN_VALUE"},

		{ w: 1, v: "Number.MAX_VALUE"},
		{ w: 1, v: "-Number.MAX_VALUE"},


		// Boundaries of maximum safe integer
		{ w: 1, v: "Number.MIN_SAFE_INTEGER"},
		{ w: 1, v: "-Number.MIN_SAFE_INTEGER"},

		{ w: 1, v: "-(2**53-2)"},
		{ w: 1, v: "-(2**53)"},
		{ w: 1, v: "-(2**53+2)"},

		{ w: 1, v: "Number.MAX_SAFE_INTEGER"},
		{ w: 1, v: "-Number.MAX_SAFE_INTEGER"},

		{ w: 1, v: "(2**53)-2"},
		{ w: 1, v: "(2**53)"},
		{ w: 1, v: "(2**53)+2"},


		// See bug 1350097 - 1.79...e308 is the largest (by module) finite number
		{ w: 1, v: "0.000000000000001"},
		{ w: 1, v: "1.7976931348623157e308"},


		// Special numbers
		{ w: 1, v: "(1/0)"},
		{ w: 1, v: "(-1/0)"},
		{ w: 1, v: "(0/0)"},


		// String literals
		{ w: 1, v: " \"\" "},
		{ w: 1, v: " '' "},
		{ w: 1, v: " 'A' "},
		{ w: 1, v: " '\\0' "},
		{ w: 1, v: " 'use strict' "},


		// Regular expression literals
		{ w: 1, v: " /x/ "},
		{ w: 1, v: " /x/g "},


		// Booleans
		{ w: 1, v: "true"},
		{ w: 1, v: "false"},


		// Undefined and null
		{ w: 1, v: "(void 0)"},
		{ w: 1, v: "null"},


		// Object literals
		{ w: 1, v: "[]"},
		{ w: 1, v: "[1]"},
		{ w: 1, v: "[(void 0)]"},
		{ w: 1, v: "{}"},
		{ w: 1, v: "{x:3}"},
		{ w: 1, v: "({})"},
		{ w: 1, v: "({x:3})"},


		// Variables that really should have been constants in the ecmascript spec
		{ w: 1, v: "NaN"},
		{ w: 1, v: "Infinity"},
		{ w: 1, v: "-Infinity"},
		{ w: 1, v: "undefined"},


		// Boxed booleans
		{ w: 1, v: "new Boolean(true)"},
		{ w: 1, v: "new Boolean(false)"},


		// Boxed numbers
		{ w: 1, v: "new Number(1)"},
		{ w: 1, v: "new Number(1.5)"},


		// Boxed strings
		{ w: 1, v: "new String('')"},
		{ w: 1, v: "new String('q')"},


		// Fun stuff
		{ w: 1, v: "function(){}"},

		{ w: 1, v: "{}"},
		{ w: 1, v: "[]"},
		{ w: 1, v: "[1]"},
		{ w: 1, v: "['z']"},
		{ w: 1, v: "[undefined]"},
		{ w: 1, v: "this"},
		{ w: 1, v: "eval"},
		{ w: 0, v: "arguments"},
		{ w: 0, v: "arguments.caller"},
		{ w: 0, v: "arguments.callee"},

		// Actual variables (slightly dangerous)
		{ w: 1, v: b.length ? Random.pick(b) : "v0"}, 
	]);
	return Number(Random.pick(specials));
}

