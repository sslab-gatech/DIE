import * as fs from "fs";
import * as path from "path";

import generate from "@babel/generator";
import { ParserOptions } from "@babel/parser";
import traverse, { NodePath, Node } from "@babel/traverse";
import * as t from "@babel/types";

import { Random, Pair, dbglog, DEBUG, assert, printf } from "./utils";
import { TSNode, TypedAST } from "./esparse";
import { st, SerializedTypes } from "./estypes";
import * as MUTATOR from "./esmutator";
import * as GENERATOR from "./esgenerator";
import { lValPreference, complexPreference } from "./espreference";


export class Code {
    path: string;

    tPath: string;
    tRawPath: string;

    dir: string;
    fname: string;
    code: string;
    
    // If raw is true,
    // it means we only have rough type information
    // of this testcase, which are got from runtime;
    // true: for typing
    // false: for fuzzing
    raw: boolean;

    constructor(fpath, raw : boolean = false) {
        assert(fs.existsSync(fpath), "file doesn't exist: " + fpath);

        this.path = fpath;
        this.code = fs.readFileSync(fpath).toString();
        this.dir = path.dirname(fpath);
        this.fname = path.basename(fpath);

        this.raw = raw;
        this.tPath = path.join(this.dir, this.fname + ".t")
        if (raw) {
            this.tRawPath = path.join(this.dir, this.fname + ".t.raw");
        } else {
            assert(fs.existsSync(this.tPath), "A typed file should have .t"); 
        }
    }

    private loadTypes(): object {
        let path: string = this.raw ? this.tRawPath : this.tPath;
        if (fs.existsSync(path)) {
            let result_json : string = fs.readFileSync(path).toString();
            let res : object = JSON.parse(result_json);
            return res;       
        } else {
            return null;
        }
    }

    public parse(options: ParserOptions = {}): TypedAST {
        let types: object = this.loadTypes();
    
        let tast: TypedAST;
        try {
            tast = new TypedAST(this.code, types, options);
        } catch (e) {
            // babel failed.
            throw new Error("[-] failed to parse the AST: " + e);
        }
    
        try {
            if (this.raw) {
                tast.ParseRaw();
            } else {
                tast.Parse();
            }
        } catch (e) {
            throw new Error("[-] failed to parse ST: " + e);
        }
        return tast;
    }

};

export class TestCase {
    tast: TypedAST;
    root: TSNode;
    code: Code;

    undefineds: Array<TSNode>;

    paths: Map<TSNode, NodePath>;

    // These are the nodes that we may mutate.
    nodes: Map<TSNode, number>;
    // These are the nodes that we temporarily 
    // remove because of mutation.
    removed: Array<Pair<NodePath, TSNode>>;
    // These are the nodes that we change 
    // their operand.
    opchanged: Array<Pair<NodePath, string>>;

    // We store (parentPath, bodyPaths) in a pair 
    // for insertion.
    bodies: Array<Pair<NodePath, Array<NodePath>>>;

    // We insert |second| number of statements after the |first|th 
    // statement. 
    // If |first| is -1, it means we insert the statements
    // at the beginning of the body.
    added: Map<number, Map<number, number>>;

    // current NodesMap for this round mutation
    curNodesMap: Map<TSNode, number>;

    MUTATE_MIN: number;
    MUTATE_MAX: number;

    INSERT_LOC_MAX: number;
    INSERT_NUM_MAX: number;

    constructor(code: Code, tast: TypedAST) {
        this.tast = tast;
        this.root = tast.root;
        this.code = code;
        this.paths = new Map<TSNode, NodePath>();
        this.nodes = new Map<TSNode, number>();
        this.undefineds = [];
        this.removed = [];
        this.opchanged = [];

        this.bodies = [];
        this.added = new Map();

        if (!this.code.raw) {
            this.preVisit(); 
        }
    }

    public config(mMin: number, mMax: number, iLocMax: number, iNumMax: number) {
        this.MUTATE_MIN = mMin;
        this.MUTATE_MAX = mMax;
        this.INSERT_LOC_MAX = iLocMax;
        this.INSERT_NUM_MAX = iNumMax;
    }

    public dumpTypes(path: string): void {
        let types: SerializedTypes = this.tast.dumpTypes();
        fs.writeFileSync(path, JSON.stringify(types));
    }

    public dumpCode(path: string, seed:number): void {
        let data = this.generate()
        //if(DEBUG) {
        //    data = "// seed:" + seed.toString() + "\n" + data
        //}
        fs.writeFileSync(path, data);
    }

    public generate(): string {
        return generate(<Node>this.root).code;
    }

    public writeToFile(path: string, seed: number, dumpType: boolean): void {
        this.dumpCode(path, seed);
        if (dumpType) {
            this.dumpTypes(path + ".t");
        }
    }

    // -1 means skip childen nodes, too.
    // 0 means skip only this node
    private preMutate(path: NodePath<Node>) : void {

        let node: TSNode = <TSNode>path.node;
        if (path.isFunction()) {
            // I don't want to change function now.
            this.nodes.set(<TSNode><t.BaseNode>path.node, 0);

            if (path.isFunctionDeclaration()) {

                // Function name is a type of declaration
                this.nodes.set(<TSNode><t.BaseNode>path.node.id, -1);

            } else if (path.isObjectMethod() || path.isClassMethod()) {

                // Do not mutate the static key of an object/class
                let key : Node = path.node.key;
                if (t.isIdentifier(key) || t.isLiteral(key)) {
                    this.nodes.set(<TSNode><t.BaseNode>path.node, -1);
                }

            }

            // Function Args are a type of declaration
            for (let param of path.node.params)
                this.nodes.set(<TSNode><t.BaseNode>param, -1);
        }

        else if (path.isVariableDeclarator()) {
            // I don't want to change left value of declaration
            this.nodes.set(<TSNode><unknown>path.node.id, -1);
            // TODO How about right value?
            // this.nodes.set(<TSNode><unknown>path.node.init, 0);
        }

        // I don't want to mutate function call in global scope (i.e., main())
        else if (path.isCallExpression() && t.isIdentifier(path.node.callee) 
                    && path.scope.hasOwnBinding(path.node.callee.name) 
                    && t.isProgram(path.scope.block)) {
            this.nodes.set(<TSNode><t.BaseNode>path.node, 0);
            this.nodes.set(<TSNode><t.BaseNode>path.node.callee, 0);
        }

        // temporary disable AssignmentExpression 
        else if (path.isAssignmentExpression()) {
            let left: TSNode = <TSNode><t.BaseNode>path.node.left;
            // Only lval
            if (!left.preference)
                left.preference = lValPreference;
            // XXX I don't want to remove any assignmentExpression in corpus
            this.nodes.set(<TSNode><t.BaseNode>path.node, 0);
        }

        // temporary disable AssignmentPattern and do not mutate left side
        else if (path.isAssignmentPattern()) {
            this.nodes.set(<TSNode><t.BaseNode>path.node.left, 0);
            this.nodes.set(<TSNode><t.BaseNode>path.node, 0);
        }

        // I don't want callexpression is changed to so simple things such as literal
        else if (path.isCallExpression()) {
            if (!node.preference)
                node.preference = complexPreference;
        }

        /// I don't want to update numeric literal ! (i.e., 123++) /////////////////
        else if (path.isUpdateExpression()) {
            let arg: TSNode = <TSNode>path.node.argument;
            if (!arg.preference)
                arg.preference = lValPreference;
        }

        /// do not mutate entire left of for...in/for...of
        else if (path.isForInStatement() || path.isForOfStatement()) {
            this.nodes.set(<TSNode><t.BaseNode>path.node.left, 0);
        }

        /// do not mutate catch (e)'s e
        else if (path.isCatchClause()) {
            this.nodes.set(<TSNode><t.BaseNode>path.node.param, 0);
        }

        /// do not mutate ObjectProperty's key if its string or id (e.g., { 'e' : 1 }'s e)
        else if (path.isObjectProperty()) {
            let key : Node = path.node.key;
            if (t.isIdentifier(key) || t.isLiteral(key)) {
                this.nodes.set(<TSNode><t.BaseNode>path.node.key, -1);
            }
        }

        /// for RestElement, we only replace the argument with LVal
        /// ???: we do not mutate RestElement itself
        else if (path.isRestElement()) {
            let arg: TSNode = <TSNode><t.BaseNode>path.node.argument;
            if (!arg.preference)
                arg.preference = lValPreference;
            this.nodes.set(<TSNode><t.BaseNode>path.node, 0);
        }

        /// skip break statement
        else if (path.isBreakStatement()) {
            this.nodes.set(<TSNode><t.BaseNode>path.node, -1);
        }

        /// do not mutate label
        else if (path.isLabeledStatement()) {
            this.nodes.set(<TSNode><t.BaseNode>path.node.label, -1);
        }

    }

    private preInsert(path : NodePath<Node>): void {
        if (path.isProgram()) {
            this.bodies.push(new Pair(path, path.get("body")));
        } else if (path.isBlockStatement()) {
            this.bodies.push(new Pair(path, path.get("body")));
        } 
    }

    private calWeight(node: TSNode): number {
        let nodeWeights: Array<number> = [1, 5, 10];
        return nodeWeights[Math.floor(1.0 * node.info.depth / (node.info.maxDepth + 1.0) * nodeWeights.length)];
    }

    private preVisit(): void {
        let weight: number = 0;
        
        const enter = (path: NodePath<Node>) => {
            let node: TSNode = <TSNode>path.node;

            this.preInsert(path);
            this.preMutate(path);

            if (this.nodes.has(node) && this.nodes.get(node) == -1) {
                path.skip();
            }

            if (node.itype) {
                if (node.itype === st.undefinedType) {
                    this.undefineds.push(node);
                } else if (!this.nodes.has(node)) {
                    this.nodes.set(node, this.calWeight(node));
                }
            }

            this.paths.set(node, path);
        };

        traverse(<Node>this.root, { enter: enter });
    }

    private invalidParents(path: NodePath): void {
        let cur: NodePath = path.parentPath;
        while (cur && !t.isProgram(cur)) {
            if (this.curNodesMap.has(<TSNode>cur.node))
                this.invalidNode(<TSNode>cur.node);
            cur = cur.parentPath;
        }
    }

    private invalidChildrens(path: NodePath, node: TSNode): void {
        this.curNodesMap.set(<TSNode>node, 0);
        traverse(<Node>node, {
            enter: (p) => {
                if (this.curNodesMap.has(<TSNode>p.node) && this.curNodesMap.get(<TSNode>p.node) !== 0) {
                    this.invalidNode(<TSNode>p.node);
                }
            }
        }, path.scope);
    }
    
    private invalidNode(node: TSNode): void {
        this.curNodesMap.set(node, 0);
    }

    private applyChange(change: MUTATOR.MutateChange): void {
        let path: NodePath = change.path;

        switch(change.type) {

            case MUTATOR.MUTATE_NODE:
                let oldNode: TSNode = change.old;
                let newNode: TSNode = change.new;
                assert(!!newNode);
                if (oldNode === newNode)
                    return;

                this.invalidChildrens(path, oldNode);
                try {
                    path.replaceWith(<Node>newNode);
                } catch (e) {
                    if (DEBUG) {
                        dbglog("===================FAIL TO MUTATE======================")
                        dbglog(generate(<Node>newNode).code);
                        dbglog(path.node)
                        dbglog(oldNode);
                        dbglog(oldNode.itype);
                        dbglog(oldNode.preference);
                        dbglog("=======================================================")
                        throw e;
                    }
                }
                this.removed.push(new Pair(path, oldNode));
                this.invalidParents(path);
                break;

            case MUTATOR.MUTATE_OPRND:
                let oldOp: string = change.old;
                (<any>path.node).operator = change.new;
                this.opchanged.push(new Pair(path, oldOp));
                this.invalidNode(<TSNode>path.node);                
                break;
            
            default:
                assert(false, "Invalid mutate change type!");
        }
    }

    public mutate(): void {
        this.curNodesMap = new Map(this.nodes); // make a copy of the weighted node map

        let mutateMax: number = Math.floor(this.nodes.size / 5);
        if (mutateMax > this.MUTATE_MAX)
            mutateMax = this.MUTATE_MAX;
        if (mutateMax < this.MUTATE_MIN)
            mutateMax = this.MUTATE_MIN;
        
      	let n: number = Random.range(this.MUTATE_MIN, mutateMax);
        for (let i = 0; i < n; i++) {
            let node: TSNode = Random.pick(Random.weightedMap(this.curNodesMap));
            if (!node)
                break;
            let path: NodePath = this.paths.get(node);
            let change: MUTATOR.MutateChange = null;
            try {
                change = MUTATOR.mutate(this, path);
            } catch (e) {
                if (DEBUG)
                    throw e;
            }
            if (change) {
                this.applyChange(change);
            }
        }

        this.curNodesMap.clear();
    }

    public insert() {
        const MAX_TRY = 3;
        for (let j = 0; j < MAX_TRY; j++) {
            let i = Random.number(this.bodies.length)
            let parentPath: NodePath = this.bodies[i].first;
            let bodyPaths: Array<NodePath> = this.bodies[i].second;

            let length: number = bodyPaths.length;
            if (!length)
                continue;
                
            // we do not insert statements after return
            if (bodyPaths[length - 1].isReturnStatement())
                length--;

            // insert in total |total| places
            let locNum: number = Math.min(this.INSERT_LOC_MAX, length + 1);
            // we do not want to insert at duplicated lines; use set here.
            let locs: Set<number> = new Set();
            
            let num: number = 0;
            while (num < locNum) {
                let loc: number = Random.number(length + 1);
                if (!locs.has(loc)) {
                    // if loc == 0, we insert at the beginning of 
                    // the block
                    let locPath: NodePath = loc ? bodyPaths[loc - 1] : parentPath; 
                    // TODO: now we insert 1 or 2 statements
                    let stmts: Array<Node> = GENERATOR.generate(this, locPath, Random.number(this.INSERT_NUM_MAX) + 1);
                    if (stmts.length > 0) {
                        if (loc == 0) {
                            (<any>parentPath).unshiftContainer("body", stmts);
                        } else {
                            bodyPaths[loc - 1].insertAfter(stmts);

                        }
                    }
                }
                num++;
           }
        }
    }

    public fuzz(): void {
        this.mutate();
        this.insert();
    }

    /*
    node key
    x    0 --> 0
    y    1 --> 3 (delete 1, 2)
    z    2 --> 5 (delete 4)

    after insert
    x    0
    a    1
    b    2
    y    3
    c    4
    z    5
    */
    public revert(): void {

        // (1) revert GENERATION
        for (let i = 0; i < this.bodies.length; i++) {
            let parentPath: NodePath = this.bodies[i].first;
            let oldBody: Array<NodePath> = this.bodies[i].second;
            let newBody: Array<NodePath> = <Array<NodePath>>parentPath.get("body");
            if (oldBody.length != newBody.length) {
                if (oldBody.length == 0) {
                    // originally no stmts,
                    // then we remove everything
                    for (let path of newBody) {
                        path.remove();
                    }
                } else {
                    let locsToRemove : Array<number> = [];
                    for (let j = 0; j < oldBody.length; j++) {
                        if (oldBody[j].key != j) {
                            let start: number = j ? <number>oldBody[j - 1].key + 1: 0;
                            for (let k = start; k < oldBody[j].key; k++) 
                                locsToRemove.push(k);
                        }
                    }
                    // also remove statments inserted at the end
                    for (let j = <number>oldBody[oldBody.length - 1].key + 1; 
                            j < newBody.length; j++) {
                        locsToRemove.push(j);
                    }

                    for (let loc of locsToRemove) {
                        newBody[loc].remove();
                    }
                }
            }
        }

        // (1) revert MUTATION
        for (let rm of this.removed) {
            let path: NodePath = rm.first;
            let node: TSNode = rm.second;
            path.replaceWith(<Node>node);
        }

        for (let opc of this.opchanged) {
            let path: NodePath = opc.first;
            let node: TSNode = <TSNode>path.node;
            MUTATOR.revertOp(node, opc.second);
        }
    }

    public getNumberLiterals(): Array<number> {
        return this.tast.numbers;
    }

    public getStringLiterals(): Array<string> {
        return this.tast.strings;
    }
};
