import { inspect } from "util";
import Colors = require("colors");
import * as printAST from "ast-pretty-print";
import { isMemberExpression } from '@babel/types';
import traverse, { Node, NodePath } from "@babel/traverse";
import { Random as i_Random, MersenneTwister19937} from "random-js";

import { TSNode } from './esparse';

export var DEBUG : boolean = false;

export function EComment(msg : string, codes : string) : string {
  return cat("/*", msg, "*/", codes);
}
class _Random {
    random: i_Random = null;
    init(seed : number) : void {
        this.random = new i_Random(MersenneTwister19937.seed(seed));
    }

    number(limit : number) : number {
        if (limit == 0) {
            return limit;
        }
        return (this.random.int32() >>> 0) % limit;
    }

    pick<T>(list : T[]) : T {
        if (!list.length)
            return null;
        return list[this.number(list.length)]; 
    }

    range(low : number, high : number) : number {
        return this.random.integer(low, high);
    }

    bool() : boolean {
        return this.random.bool();
    }

    weighted(weighted_array : any[]) : any[] {
        var extended : any[] = [];
        for (var i = 0; i < weighted_array.length; ++i) {
            for (var j = 0; j < weighted_array[i].w; ++j) {
                extended.push(weighted_array[i].v);
            }
        }
        return extended;
    }

    weightedMap(map : Map<any, any>) : any[] {
        var a : any[] = [];
        map.forEach((value : any, key : any) => {
            for (var i = 0; i < value; i++) {
                a.push(key);
            }
        });
        return a;
    }

    prefix(len: number): string {
        var ret: string = "";
        var chars: string = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for (var i = 0; i < len; i++)
            ret += chars.charAt(this.number(chars.length));

        return ret;
    }
};

export function dbginspect(msg: any): string {
    if (DEBUG) {
        return inspect(msg, false, 1);
    }
}

export function dbgAST(ast, pretty = true) {
    if (DEBUG) {
        if (pretty)
            printf(printAST(ast, true))
        else {
            let prefix = "";
            let stack = [];
            traverse(ast, {
                enter: path => {
                    let node: TSNode = <TSNode>path.node;
                    dbglog(prefix + ("type : " + node.type).cyan);
                    dbglog(prefix + JSON.stringify(node.loc));
                    //dbglog(prefix + "features : " + dbginspect(node.feature));
                    if (node.itype) {
                        if (isMemberExpression(node)) {
                            dbglog(prefix + ("itype : " + dbginspect(node.itype)).yellow);
                        }
                        else {
                            dbglog(prefix + ("itype : " + dbginspect(node.itype)).blue);
                        }
                    }
                    else {
                        dbglog(prefix + ("itype : " + dbginspect(node.itype)).red);
                    }
                    stack.push(prefix);
                    prefix += "  ";
                },
                exit: path => {
                    prefix = stack.pop();
                }
            })
        }
    }
}
export const Random = new _Random();
export function arraysEqual<T>(a : T[], b : T[]) : boolean {
  if (a === b) return true;
  if (a.length != b.length) return false;

  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export function printf(msg : any) : void {
    console.log(msg);
}

export function dbglog(msg : any, pretty=false) : void {
    if(DEBUG) {
        if(pretty)
            dbglog(dbginspect(msg).red);
        else
            console.log(msg);

    }
}

export function assert(cond : boolean, msg : string = "") : void {
    if (!cond) {
        msg = msg || "Assertion failed!";
        if (typeof Error != "undefined") {
            throw new Error("[-] " + msg);
        }
        throw msg;
    }
}
export function dbgassert(cond : boolean, msg : string = "") : void {
    if (!cond && DEBUG) {
        msg = msg || "Assertion failed!";
        if (typeof Error != "undefined") {
            throw new Error("[-] " + msg);
        }
        throw msg;
    }
}

export function cat(...strs : string[]) : string {
    return Array.prototype.join.call(strs, "");
}

export function strict(str : string) : boolean {
    if (str.includes("use strict") || str.includes("use asm")) {
      return true;
    }
    return false
}


export class Pair <T, U> {
    first : T;
    second : U;
    constructor(first : T, second : U) {
        this.first = first;
        this.second = second;
    }
}

export type Lit = string | number | boolean | undefined | null | void | {};
export const tuple = <T extends Lit[]>(...args: T) => args;

export function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Random.number(i + 1);
        [array[i], array[j]] = [array[j], array[i]];
    }
}

export function randomArray(length) : number[] {
    let array : number[] = new Array(length);
    for (let i = 0; i < length; i++) {
        array[i] = i;
    }
    shuffleArray(array);
    return array;
}

export function randomKeyString() : string {
    return Random.bool() ? "dun" + Random.number(8) : "" + Random.number(8);
}

export function equalArray(a : [], b : []) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length != b.length) return false;
  
    for (let i = 0; i < a.length; ++i) {
        if (!b.includes(a[i])) return false;
    }
    return true;
}

export function isNumeric(x) {
    return !isNaN(x);
}

export function inRange(x : number, range : number[]) : boolean {
    return (x >= range[0]) && (x < range[1]); 
}

export function makeLocTuple(node: Node): string {
    let start = node.start;
    let end = node.end;
    if (!node.loc) {
        printf(node);
    }
    let line = node.loc.start.line;
    return "<" + start + "," + end + "," + line+ ">";
}
