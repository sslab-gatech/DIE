import { Program } from "@babel/types";
import traverse from "@babel/traverse";

import { TSNode } from "./esparse";
import { isEqual } from "./estypes";
import { assert } from "./utils";
import { inspect } from "util";

export function Verifier(ast : TSNode) {
    traverse(<Program><unknown>ast, {
        AssignmentExpression(path) {
            let left : TSNode = <TSNode><unknown>path.node.left;
            let right : TSNode = <TSNode><unknown>path.node.right;
            assert(isEqual(left.itype, right.itype), inspect(left, false, 1, true) + "\n" + inspect(right, false, 1, true))
        }
    })
}