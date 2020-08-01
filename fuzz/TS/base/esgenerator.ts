import * as bt from "@babel/types"
import traverse, { Node, NodePath } from "@babel/traverse";

import { TSNode } from "./esparse";
import { builder, stmtBuilder } from "./engine/esbuild";
import { printf } from "./utils";
import { TestCase } from "./estestcase";

export function generate(tc : TestCase, path : NodePath, n : number) : Array<Node> {
    let stmts: Array<TSNode> = new Array();
    let i: number = 0;

    builder.initBuildingContext(tc, path, 1);
    while (i < n) {
        let stmt : TSNode = stmtBuilder.build();
        if (stmt) {
            stmts.push(stmt);
        }
        i++;
    }

    return <Array<Node>>stmts;
}