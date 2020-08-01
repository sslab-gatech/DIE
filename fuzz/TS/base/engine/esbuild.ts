import { NodePath } from "@babel/traverse";
import { Random } from "../utils";
import { TypeBuilder } from "./type";
import { TSNodeBuilder } from "./ast";
import { Types } from "../estypes";
import { TSNode } from "../esparse";
import { TestCase } from "../estestcase";
import { VariableBuilder } from "./var";
import { LiteralBuilder } from "./literal";
import { BuildingContext } from "./context";
import { FunctionBuilder } from "./function";
import { MutateChange, MUTATE_NODE } from "../esmutator";
import { defaultPreference } from "../espreference";
import { BlockStatementBuilder, StatementBuilder } from "./statement";
import { FunctionExpressionBuilder, AssignExpressionBuilder, BinaryExpressionBuilder, LogicalExpressionBuilder, UnaryExpressionBuilder, UpdateExpressionBuilder, NewExpressionBuilder, MemberExpressionBuilder, ArrayExpressionBuilder, ObjectExpressionBuilder } from "./exp";
import { NumberBuilder, MathBuilder, DateBuilder, StringBuilder, RegExpBuilder, ArrayBuilder, TypedArrayBuilder, MapBuilder, SetBuilder, WeakMapBuilder, WeakSetBuilder, ArrayBufferBuilder, DataViewBuilder, IteratorBuilder, ObjectBuilder, NumberCtorBuilder, DateCtorBuilder, StringCtorBuilder, RegExpCtorBuilder, ArrayCtorBuilder, TypedArrayCtorBuilder, MapCtorBuilder, SetCtorBuilder, WeakMapCtorBuilder, WeakSetCtorBuilder, ArrayBufferCtorBuilder, DataViewCtorBuilder, FunctionCtorBuilder, ObjectCtorBuilder } from "./builtin";

// **************************************************************************************
//
// Interface 
//
// **************************************************************************************
export interface NodeBuilder {
    name : string;
    build : (n: number, s: string, t: Types, o: TSNode) => TSNode;
}
export type BuildInfo = { ['w']: number, ['v']: { ['b']: NodeBuilder, ['o']: string } }

// **************************************************************************************
//
// Global builder
//
// **************************************************************************************
class Builder {
    // AST
    astBuilder: TSNodeBuilder;

    // variable
    varBuilder: VariableBuilder;

    // type builder
    TypeBuilder: TypeBuilder;

    // literal builder
    LiteralBuilder: LiteralBuilder;

    // expression
    BinaryExpressionBuilder: BinaryExpressionBuilder;
    LogicalExpressionBuilder: LogicalExpressionBuilder;
    UnaryExpressionBuilder: UnaryExpressionBuilder;
    UpdateExpressionBuilder: UpdateExpressionBuilder;
    NewExpressionBuilder: NewExpressionBuilder;
    MemberExpressionBuilder: MemberExpressionBuilder;
    ArrayExpressionBuilder: ArrayExpressionBuilder;
    FunctionExpressionBuilder : FunctionExpressionBuilder;

    // type-based
    NumberBuilder: NumberBuilder;
    NumberCtorBuilder: NumberCtorBuilder;
    
    MathBuilder: MathBuilder;

    DateBuilder: DateBuilder;
    DateCtorBuilder: DateCtorBuilder;
    
    StringBuilder: StringBuilder;
    StringCtorBuilder: StringCtorBuilder;

    RegExpBuilder: RegExpBuilder;
    RegExpCtorBuilder: RegExpCtorBuilder;
    
    ArrayBuilder: ArrayBuilder;
    ArrayCtorBuilder: ArrayCtorBuilder;

    TypedArrayBuilder: TypedArrayBuilder;
    TypedArrayCtorBuilder: TypedArrayCtorBuilder;
    
    MapBuilder: MapBuilder;
    MapCtorBuilder: MapCtorBuilder;

    SetBuilder: SetBuilder;
    SetCtorBuilder: SetCtorBuilder;

    WeakMapBuilder: WeakMapBuilder;
    WeakMapCtorBuilder: WeakMapCtorBuilder;
    
    WeakSetBuilder: WeakSetBuilder;
    WeakSetCtorBuilder: WeakSetCtorBuilder;

    ArrayBufferBuilder: ArrayBufferBuilder;
    ArrayBufferCtorBuilder: ArrayBufferCtorBuilder;

    DataViewBuilder: DataViewBuilder;
    DataViewCtorBuilder: DataViewCtorBuilder;

    // FunctionBuilder: FunctionBuilder;
    // FunctionCtorBuilder: FunctionCtorBuilder;

    ObjectBuilder: ObjectBuilder;
    ObjectCtorBuilder: ObjectCtorBuilder;

    IteratorBuilder: IteratorBuilder;
    

    ExpressionBuilder: object;
    builtinBuilders: object;
    builtinCtorBuilders: object;

    ObjectExpressionBuilder : ObjectExpressionBuilder;

    // xxx
    assignExpressionBuilder: AssignExpressionBuilder;
    statementBuilder: StatementBuilder;
    blockStatementBuilder : BlockStatementBuilder;

    context: BuildingContext;
    inFuncExp : boolean;
    inArg : boolean;

    DEPTH: number;
    FUNC_SIZE: number;

    varCnt: number;

    constructor() {
        
        this.astBuilder = new TSNodeBuilder();
        this.varBuilder = new VariableBuilder();
        this.LiteralBuilder = new LiteralBuilder();

        this.MemberExpressionBuilder = new MemberExpressionBuilder();

        this.BinaryExpressionBuilder = new BinaryExpressionBuilder();
        this.UnaryExpressionBuilder = new UnaryExpressionBuilder();
        this.UpdateExpressionBuilder = new UpdateExpressionBuilder();
        this.LogicalExpressionBuilder = new LogicalExpressionBuilder();

        this.NewExpressionBuilder = new NewExpressionBuilder();
        this.ArrayExpressionBuilder = new ArrayExpressionBuilder();
        this.FunctionExpressionBuilder = new FunctionExpressionBuilder();

        this.builtinBuilders = {};
        this.builtinCtorBuilders = {};

        this.builtinBuilders["Number"] = this.NumberBuilder = new NumberBuilder();
        this.builtinCtorBuilders["NumberCtor"] = this.NumberCtorBuilder = new NumberCtorBuilder();

        this.builtinCtorBuilders["Math"] = this.MathBuilder = new MathBuilder();

        this.builtinBuilders["Date"] = this.DateBuilder = new DateBuilder();
        this.builtinCtorBuilders["DateCtor"] = this.DateCtorBuilder = new DateCtorBuilder();

        this.builtinBuilders["String"] = this.StringBuilder = new StringBuilder();
        this.builtinCtorBuilders["StringCtor"] = this.StringCtorBuilder = new StringCtorBuilder();

        this.builtinBuilders["RegExp"] = this.RegExpBuilder = new RegExpBuilder();
        this.builtinCtorBuilders["RegExpCtor"] = this.RegExpCtorBuilder = new RegExpCtorBuilder();

        this.builtinBuilders["Array"] = this.ArrayBuilder = new ArrayBuilder();
        this.builtinCtorBuilders["ArrayCtor"] = this.ArrayCtorBuilder = new ArrayCtorBuilder();

        this.builtinBuilders["TypedArray"] = this.TypedArrayBuilder = new TypedArrayBuilder();
        this.builtinCtorBuilders["TypedArrayCtor"] = this.TypedArrayCtorBuilder = new TypedArrayCtorBuilder();

        this.builtinBuilders["Map"] = this.MapBuilder = new MapBuilder();
        this.builtinCtorBuilders["MapCtor"] = this.MapCtorBuilder = new MapCtorBuilder();

        this.builtinBuilders["Set"] = this.SetBuilder = new SetBuilder();
        this.builtinCtorBuilders["SetCtor"] = this.SetCtorBuilder = new SetCtorBuilder();

        this.builtinBuilders["WeakMap"] = this.WeakMapBuilder = new WeakMapBuilder();
        this.builtinCtorBuilders["WeakMapCtor"] = this.WeakMapCtorBuilder = new WeakMapCtorBuilder();

        this.builtinBuilders["WeakSet"] = this.WeakSetBuilder = new WeakSetBuilder();
        this.builtinCtorBuilders["WeakSetCtor"] = this.WeakSetCtorBuilder = new WeakSetCtorBuilder();

        this.builtinBuilders["ArrayBuffer"] = this.ArrayBufferBuilder = new ArrayBufferBuilder();
        this.builtinCtorBuilders["ArrayBufferCtor"] = this.ArrayBufferCtorBuilder = new ArrayBufferCtorBuilder();
        
        this.builtinBuilders["DataView"] = this.DataViewBuilder = new DataViewBuilder();
        this.builtinCtorBuilders["DataViewCtor"] = this.DataViewCtorBuilder = new DataViewCtorBuilder();

        // this.builtinBuilders["Function"] = this.FunctionBuilder = new FunctionBuilder();
        // this.builtinCtorBuilders["FunctionCtor"] = this.FunctionCtorBuilder = new FunctionCtorBuilder();

        this.builtinBuilders["Object"] = this.ObjectBuilder = new ObjectBuilder();
        this.builtinCtorBuilders["ObjectCtor"] = this.ObjectCtorBuilder = new ObjectCtorBuilder();

        this.builtinBuilders["Iterator"] = this.IteratorBuilder = new IteratorBuilder();
        

        this.TypeBuilder = new TypeBuilder();

        this.ObjectExpressionBuilder = new ObjectExpressionBuilder();

        this.assignExpressionBuilder = new AssignExpressionBuilder();
        this.statementBuilder = new StatementBuilder();
        this.blockStatementBuilder = new BlockStatementBuilder();

        this.inFuncExp = false;
        this.inArg = false;
    }

    public initBuildingContext(tc: TestCase, path: NodePath, mode: number) {
        this.context = new BuildingContext(tc, path, mode);
    }

    public setInFuncExp() : void {
        this.inFuncExp = true;
    }

    public resetInFuncExp() : void {
        this.inFuncExp = false;
    }

    public isInFuncExp() : boolean {
        return this.inFuncExp;
    }

    public config(depth: number, size: number): void {
        this.DEPTH = depth;
        this.FUNC_SIZE = size;
    }

    public setVarCnt(cnt: number) {
        this.varCnt = cnt;
    }

    public genVarId(): string {
        this.varCnt++;
        return "__es_v" + this.varCnt;
    }
};

export const builder = new Builder();
export const astBuilder = builder.astBuilder;
export const varBuilder = builder.varBuilder;
export const memExpBuilder = builder.MemberExpressionBuilder;
export const funcExpBuilder = builder.FunctionExpressionBuilder;
export const objExpBuilder = builder.ObjectExpressionBuilder;
export const literalBuilder = builder.LiteralBuilder;
export const typeBuilder = builder.TypeBuilder;
export const assignBuilder = builder.assignExpressionBuilder;
export const blockBuilder = builder.blockStatementBuilder;
export const stmtBuilder = builder.statementBuilder;

export function buildStatementForMutation(tc: TestCase, path: NodePath): MutateChange {
    let tnode: TSNode = <TSNode>path.node;
    let node: TSNode = null;
    let TRYTIMES: number = 3;

    for (let i = 0; !node && i < TRYTIMES; i++) {
        node = <TSNode>stmtBuilder.build(); 
    }

    if (node) {
        return { "type": MUTATE_NODE, "path": path, "old": tnode, "new": node }; 
    } else {
        return null;
    }
}

export function buildNodeForMutation(tc: TestCase, path: NodePath): MutateChange {
    let TRYTIMES: number = 3;
    let tnode: TSNode = <TSNode>path.node;
    let type: Types = tnode.itype; 
    let node: TSNode = null;

    for (let i = 0; !node && i < TRYTIMES; i++) {
        node = <TSNode>typeBuilder.build(builder.DEPTH, type, tnode.preference ? tnode.preference : defaultPreference); 
    }

    if (node) {
        return { "type": MUTATE_NODE, "path": path, "old": tnode, "new": node };
    } else {
        return null;
    }
}

