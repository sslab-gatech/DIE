import * as FS from "fs";
import { inspect } from "util";

import * as bt from "@babel/types"
import { parse } from "@babel/parser";
import traverse, { Node, NodePath, Binding } from "@babel/traverse"
import generate from "@babel/generator"

import { TSNode } from "./esparse";
import { TestCase } from "./estestcase";
import { dbglog, assert, printf, Random } from "./utils";
import { builder, buildStatementForMutation, buildNodeForMutation } from "./engine/esbuild";
import { Types, st, isEqual, FunctionType } from "./estypes";

export type MutateChangeType = 0 | 1;
export const MUTATE_NODE: MutateChangeType = 0; 
export const MUTATE_OPRND: MutateChangeType = 1;
export type MutateChange = { 
    "type": MutateChangeType, 
    "path": NodePath,
    "old": any,
    "new": any 
};

export const TRYTIMES : number = 3;

function isOpMutableExpression(node): boolean {
    return bt.isBinaryExpression(node) 
        || bt.isLogicalExpression(node) 
        || bt.isUnaryExpression(node) 
        || bt.isUpdateExpression(node);
}

export function revertOp(node: TSNode, op: string): void {
    if (isOpMutableExpression(node)) {
        (<any>node).operator = <any>op;
    } else {
        assert(false, "Invalid expression to revert the operand.");
    }
}

export function mutateExpOp(tc: TestCase, path: NodePath): MutateChange {
    let node: TSNode = <TSNode>path.node;
    let change: MutateChange = null;

    if (!Random.number(3)) {
        if (bt.isBinaryExpression(node)) {
            change = builder.BinaryExpressionBuilder.mutateOp(path);
        } else if (bt.isLogicalExpression(node)) {
            change = builder.LogicalExpressionBuilder.mutateOp(path);
        } else if (bt.isUnaryExpression(node)) {
            change = builder.UnaryExpressionBuilder.mutateOp(path);
        } else if (bt.isUpdateExpression(node)) {
            change = builder.UpdateExpressionBuilder.mutateOp(path);
        }
    }

    return change;
}

export function mutate(tc: TestCase, path: NodePath): MutateChange {
    let node: TSNode = <TSNode>path.node;
    let type: Types = node.itype;
    
    if (type && type instanceof FunctionType || type === st.undefinedType)
        return null;

    builder.initBuildingContext(tc, path, 0);

    // mutate statement: replace with a new statement
    // do all statements have void type?
    if (bt.isStatement(node)) {
        if (bt.isExpressionStatement(node)) {
            return buildStatementForMutation(tc, path);
        } else {
            return null;
        }
    }

    // mutate expression
    // first, try to mutate op
    // if failed, we drop to the later way
    if (bt.isExpression(node) && isOpMutableExpression(node)) {
        let change: MutateChange = mutateExpOp(tc, path); 
        if (change)
            return change;
    } 

    if (type) {
        // replace-based mutation
        return buildNodeForMutation(tc, path);
    }

    return null;
}

