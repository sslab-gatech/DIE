import * as fs from "fs";
import * as path from "path";

import traverse, { Node, NodePath } from "@babel/traverse";
import { Random, assert, printf, strict } from "./base/utils";
import { TSNode } from "./base/esparse";
import { Inferer } from "./base/esinfer";
import { TypedAST } from "./base/esparse";
import { builder } from "./base/engine/esbuild";
import { Code, TestCase } from "./base/estestcase";

const MUTATE: number = 0, INSERT: number = 1;

function init(seed: number): number {
    let _seed: number = seed ? seed : Math.floor(Math.random() * Math.pow(2, 28));
    Random.init(_seed);
    return _seed;
}

function main() {

    let fpath = process.argv[2]; // input file
    let dpath = process.argv[3]; // output dir
    let cnt = parseInt(process.argv[4]); // file num
    let seed = parseInt(process.argv[5]); // seed for repro seeducing
    seed = init(seed);

    if (!fpath.endsWith(".js")) {
        assert(false, "corpus should be javascript (.js) file")
        return -1;
    }

    let code : Code = new Code(fpath);
    let tast : TypedAST = code.parse();

    let tc = new TestCase(code, tast);

    tc.config(4, 8, 2, 1);
    builder.config(2, 2);

    for (let i = 0; i < cnt; i++) {

        // for each test case, we reset the var cnt
        builder.setVarCnt(tast.maxVarCnt);
        let _fpath: string = dpath + "/" + i + ".js";
        switch(Random.number(3)) {
            case 0:
            case 1:
                tc.mutate();
                tc.writeToFile(_fpath, seed, true);
                tc.revert();
                break;
            case 2:
                tc.insert();
                tc.writeToFile(_fpath, seed, true);
                tc.revert();
                break;
        }

   }

}

main();
