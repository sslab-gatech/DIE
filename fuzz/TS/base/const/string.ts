import * as UTILS from "../utils";
const Random = UTILS.Random;

export function gen() : string {
	var specials = Random.weighted([
   		{ w : 2, v : [
			"v0",
			"v1",
			"v2",
			"1024",
			"\u3056",
			"+0",
			"-0",
			"eval",
			"1.23",
			"{}",
			"",
		]},
    	// from jsfunfuzz
    	{w : 3, v : [
			"__proto__", 
			"constructor", 
			"prototype",
			"wrappedJSObject",
			"arguments", 
			"caller", 
			"callee", 
			"toString", 
			"valueOf",
			"call", 
			"apply", // ({apply:...}).apply() hits a special case (speculation failure with funapply / funcall bytecode)
			"length",
			"0", 
			"1"
		]},
    	{w : 3, v : [
			"configurable",
			"enumberable", 
			"value", 
			"writable",
			"get", 
			"set",
			"valueOf"
		]},
	]);
	return Random.pick(Random.pick(specials));
}

