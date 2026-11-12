import { TlaUnsupportedError } from "../../errors";
import {
  getComponentSet,
  getEnumeration,
  getFieldKeys,
  getIntegers,
  getRecordAxioms,
  getRecordExcepts,
  getTupleAxioms,
  getTupleExcepts,
  getTyping,
  TYPED_OPERATORS,
} from "./axioms";
import {
  APPEND,
  BOOL_SET,
  CAP,
  CAST_BOOL,
  CAST_INT,
  CAT,
  declare,
  forall,
  FUN_APP,
  FUN_DOM,
  FUN_EXCEPT,
  FUN_ISAFCN,
  FUN_SET,
  HEAD,
  INT_LTEQ,
  INT_RANGE,
  INT_SET,
  IS_SET_OF,
  LEN,
  MEM,
  NAT_SET,
  PROJ_INT,
  SEQ,
  SET_EXT_TRIGGER,
  STR_SET,
  SUB_SEQ,
  SUBSET,
  SUBSET_EQ,
  TAIL,
  tla,
  TRIG_EQ,
  TT_IDV,
  UNION,
} from "./format";
import { axiom, type Axiom } from "./table";

export interface SymbolSpec {
  declaration: string | undefined;
  deps: string[];
  axioms: Axiom[];
}

export interface CollectState {
  recordFields: Map<string, string[]>;
  strings: string[];
  isFunConstr: boolean;
  isFunSet: boolean;
  isExcept: boolean;
  tuples: number[];
  records: string[][];
  anonymous: Map<string, number>;
}

const SEQUENCE_DEPS = ["Mem", "Seq", "Len", "FunApp", "NatSet", "Cast_Int", "Proj_Int"];

const INT_EXP = tla("IntExp");

const SUB_SEQ_RANGE = `(${SUB_SEQ} s (${CAST_INT} x) (${CAST_INT} y))`;

const createSpec = (
  declaration: string | undefined,
  deps: string[],
  axioms: Axiom[],
): SymbolSpec => ({ declaration, deps, axioms });

const declareSpec = (name: string, arity: number, deps: string[], axioms: Axiom[], sort = "Idv") =>
  createSpec(declare(tla(name), arity, sort), deps, axioms);

const getSetOperationDef = (name: string, condition: string) =>
  axiom(
    `${name}Def`,
    [],
    `(forall ((a Idv) (b Idv) (x Idv)) (! (= (${MEM} x (${tla(name)} a b)) ${condition}) :pattern ((${MEM} x (${tla(name)} a b))) :pattern ((${MEM} x a) (${tla(name)} a b)) :pattern ((${MEM} x b) (${tla(name)} a b))))`,
  );

const STATIC_SPECS = new Map(
  Object.entries({
    IntExp: declareSpec(
      "IntExp",
      2,
      ["Mem", "IntSet", "Cast_Int", "TIntLteq", "TIntLit_0", "TIntLit_1"],
      [
        axiom(
          "IntExpTyping",
          [],
          `(forall ((x Idv) (y Idv)) (! (=> (and (${MEM} x ${INT_SET}) (${MEM} y ${INT_SET}) (or (distinct x (${CAST_INT} 0)) (${INT_LTEQ} (${CAST_INT} 1) y))) (${MEM} (${INT_EXP} x y) ${INT_SET})) :pattern ((${INT_EXP} x y))))`,
        ),
      ],
    ),
    SelectSeq: createSpec(
      undefined,
      [
        "Mem",
        "Seq",
        "Len",
        "Append",
        "FunApp",
        "FunDom",
        "IntSet",
        "NatSet",
        "Tuple_0",
        "Proj_Int",
      ],
      [
        axiom("SeqSelectseqTyping", [], undefined),
        axiom("SeqSelectseqLen", [], undefined),
        axiom("SeqSelectseqNil", [], undefined),
        axiom("SeqSelectseqApp", [], undefined),
        axiom("SeqSelectseqAppend", [], undefined),
      ],
    ),
    Choose: createSpec(undefined, [], [axiom("ChooseDef", [], undefined)]),
    Mem: declareSpec(
      "Mem",
      2,
      ["SetExtTrigger"],
      [
        axiom(
          "SetExt",
          [],
          `(forall ((x Idv) (y Idv)) (! (=> (forall ((z Idv)) (= (${MEM} z x) (${MEM} z y))) (= x y)) :pattern ((${SET_EXT_TRIGGER} x y))))`,
        ),
      ],
      "Bool",
    ),
    SubsetEq: declareSpec(
      "SubsetEq",
      2,
      ["Mem"],
      [
        axiom(
          "SubsetEqIntro",
          [],
          `(forall ((x Idv) (y Idv)) (! (=> (forall ((z Idv)) (=> (${MEM} z x) (${MEM} z y))) (${SUBSET_EQ} x y)) :pattern ((${SUBSET_EQ} x y))))`,
        ),
        axiom(
          "SubsetEqElim",
          [],
          `(forall ((x Idv) (y Idv) (z Idv)) (! (=> (and (${SUBSET_EQ} x y) (${MEM} z x)) (${MEM} z y)) :pattern ((${SUBSET_EQ} x y) (${MEM} z x))))`,
        ),
      ],
      "Bool",
    ),
    Union: declareSpec(
      "Union",
      1,
      ["Mem"],
      [
        axiom(
          "UnionIntro",
          [],
          `(forall ((a Idv) (x Idv) (y Idv)) (! (=> (and (${MEM} y a) (${MEM} x y)) (${MEM} x (${UNION} a))) :pattern ((${MEM} y a) (${MEM} x (${UNION} a))) :pattern ((${MEM} x y) (${MEM} x (${UNION} a))) :pattern ((${MEM} y a) (${MEM} x y) (${UNION} a))))`,
        ),
        axiom(
          "UnionElim",
          [],
          `(forall ((a Idv) (x Idv)) (! (=> (${MEM} x (${UNION} a)) (exists ((y Idv)) (and (${MEM} y a) (${MEM} x y)))) :pattern ((${MEM} x (${UNION} a)))))`,
        ),
      ],
    ),
    Subset: declareSpec(
      "Subset",
      1,
      ["Mem", "SubsetEq"],
      [
        axiom(
          "SubsetDefAlt",
          [],
          `(forall ((a Idv) (x Idv)) (! (= (${MEM} x (${SUBSET} a)) (${SUBSET_EQ} x a)) :pattern ((${MEM} x (${SUBSET} a))) :pattern ((${SUBSET_EQ} x a) (${SUBSET} a))))`,
        ),
      ],
    ),
    Cup: declareSpec(
      "Cup",
      2,
      ["Mem"],
      [getSetOperationDef("Cup", `(or (${MEM} x a) (${MEM} x b))`)],
    ),
    Cap: declareSpec(
      "Cap",
      2,
      ["Mem", "SetEnum_0", "SetExtTrigger"],
      [
        getSetOperationDef("Cap", `(and (${MEM} x a) (${MEM} x b))`),
        axiom(
          "DisjointTrigger",
          [],
          `(forall ((x Idv) (y Idv)) (! (${SET_EXT_TRIGGER} (${CAP} x y) ${tla("SetEnum_0")}) :pattern ((${CAP} x y))))`,
        ),
      ],
    ),
    SetMinus: declareSpec(
      "SetMinus",
      2,
      ["Mem"],
      [getSetOperationDef("SetMinus", `(and (${MEM} x a) (not (${MEM} x b)))`)],
    ),
    SetSt: createSpec(
      undefined,
      ["Mem", "SetEnum_0", "SetExtTrigger"],
      [axiom("SetStDef", [], undefined), axiom("EmptyComprehensionTrigger", [], undefined)],
    ),
    NatSet: declareSpec(
      "NatSet",
      0,
      ["IntSet", "TIntLit_0", "Cast_Int", "IntLteq"],
      [
        axiom(
          "NatSetDef",
          [],
          `(forall ((x Idv)) (! (= (${MEM} x ${NAT_SET}) (and (${MEM} x ${INT_SET}) (${INT_LTEQ} (${CAST_INT} 0) x))) :pattern ((${MEM} x ${NAT_SET}))))`,
        ),
      ],
    ),
    IntRange: declareSpec(
      "IntRange",
      2,
      ["Mem", "IntSet", "IntLteq"],
      [
        axiom(
          "IntRangeDef",
          [],
          `(forall ((a Idv) (b Idv) (x Idv)) (! (= (${MEM} x (${INT_RANGE} a b)) (and (${MEM} x ${INT_SET}) (${INT_LTEQ} a x) (${INT_LTEQ} x b))) :pattern ((${MEM} x (${INT_RANGE} a b)))))`,
        ),
      ],
    ),
    FunIsafcn: declareSpec(
      "FunIsafcn",
      1,
      ["Mem", "FunDom", "FunFcn", "FunApp"],
      [
        axiom(
          "FunExt",
          [],
          `(forall ((f Idv) (g Idv)) (! (=> (and (${FUN_ISAFCN} f) (${FUN_ISAFCN} g) (= (${FUN_DOM} f) (${FUN_DOM} g)) (forall ((x Idv)) (=> (${MEM} x (${FUN_DOM} f)) (= (${FUN_APP} f x) (${FUN_APP} g x))))) (= f g)) :pattern ((${FUN_ISAFCN} f) (${FUN_ISAFCN} g))))`,
        ),
      ],
      "Bool",
    ),
    FunDom: declareSpec("FunDom", 1, ["FunFcn"], [axiom("FunDomDef", [], undefined)]),
    FunApp: declareSpec("FunApp", 2, ["Mem", "FunFcn"], [axiom("FunAppDef", [], undefined)]),
    // tlapm labels SeqSetElim1 and SeqSetElim2 SetSetElim1 and SetSetElim2.
    Seq: declareSpec(
      "Seq",
      1,
      [
        "Mem",
        "Len",
        "FunIsafcn",
        "FunDom",
        "FunApp",
        "IntSet",
        "NatSet",
        "IntRange",
        "Cast_Int",
        "Proj_Int",
      ],
      [
        axiom(
          "SeqSetIntro",
          [],
          `(forall ((a Idv) (s Idv)) (! (=> (and (${FUN_ISAFCN} s) (>= (${PROJ_INT} (${LEN} s)) 0) (forall ((i Idv)) (= (${MEM} i (${FUN_DOM} s)) (and (${MEM} i ${INT_SET}) (<= 1 (${PROJ_INT} i)) (<= (${PROJ_INT} i) (${PROJ_INT} (${LEN} s)))))) (forall ((i Int)) (=> (and (<= 1 i) (<= i (${PROJ_INT} (${LEN} s)))) (${MEM} (${FUN_APP} s (${CAST_INT} i)) a)))) (${MEM} s (${SEQ} a))) :pattern ((${MEM} s (${SEQ} a)))))`,
        ),
        axiom(
          "SeqSetElim1",
          [],
          `(forall ((a Idv) (s Idv)) (! (=> (${MEM} s (${SEQ} a)) (and (${FUN_ISAFCN} s) (${MEM} (${LEN} s) ${NAT_SET}) (= (${FUN_DOM} s) (${INT_RANGE} (${CAST_INT} 1) (${LEN} s))))) :pattern ((${MEM} s (${SEQ} a)))))`,
          "SetSetElim1",
        ),
        axiom(
          "SeqSetElim2",
          [],
          `(forall ((a Idv) (s Idv) (i Int)) (! (=> (and (${MEM} s (${SEQ} a)) (<= 1 i) (<= i (${PROJ_INT} (${LEN} s)))) (${MEM} (${FUN_APP} s (${CAST_INT} i)) a)) :pattern ((${MEM} s (${SEQ} a)) (${FUN_APP} s (${CAST_INT} i)))))`,
          "SetSetElim2",
        ),
      ],
    ),
    Len: declareSpec(
      "Len",
      1,
      ["FunDom", "IntRange", "Cast_Int"],
      [
        axiom(
          "SeqLenDef",
          [],
          `(forall ((s Idv) (z Int)) (=> (and (>= z 0) (= (${FUN_DOM} s) (${INT_RANGE} (${CAST_INT} 1) (${CAST_INT} z)))) (= (${LEN} s) (${CAST_INT} z))))`,
        ),
      ],
    ),
    BSeq: declareSpec("BSeq", 1, [], []),
    Cat: declareSpec("Cat", 2, SEQUENCE_DEPS, [
      axiom(
        "SeqCatTyping",
        [],
        `(forall ((a Idv) (s Idv) (t Idv)) (! (=> (and (${MEM} s (${SEQ} a)) (${MEM} t (${SEQ} a))) (${MEM} (${CAT} s t) (${SEQ} a))) :pattern ((${MEM} s (${SEQ} a)) (${CAT} s t)) :pattern ((${MEM} t (${SEQ} a)) (${CAT} s t))))`,
      ),
      axiom(
        "SeqCatLen",
        [],
        `(forall ((s Idv) (t Idv)) (! (=> (and (${MEM} (${LEN} s) ${NAT_SET}) (${MEM} (${LEN} t) ${NAT_SET})) (= (${LEN} (${CAT} s t)) (${CAST_INT} (+ (${PROJ_INT} (${LEN} s)) (${PROJ_INT} (${LEN} t)))))) :pattern ((${CAT} s t))))`,
      ),
      axiom(
        "SeqCatApp1",
        [],
        `(forall ((s Idv) (t Idv) (i Int)) (! (=> (and (${MEM} (${LEN} s) ${NAT_SET}) (${MEM} (${LEN} t) ${NAT_SET}) (<= 1 i) (<= i (${PROJ_INT} (${LEN} s)))) (= (${FUN_APP} (${CAT} s t) (${CAST_INT} i)) (${FUN_APP} s (${CAST_INT} i)))) :pattern ((${FUN_APP} (${CAT} s t) (${CAST_INT} i))) :pattern ((${CAT} s t) (${FUN_APP} s (${CAST_INT} i)))))`,
      ),
      axiom(
        "SeqCatApp2",
        [],
        `(forall ((s Idv) (t Idv) (i Int)) (! (=> (and (${MEM} (${LEN} s) ${NAT_SET}) (${MEM} (${LEN} t) ${NAT_SET}) (<= i (+ (${PROJ_INT} (${LEN} s)) (${PROJ_INT} (${LEN} t)))) (< (${PROJ_INT} (${LEN} s)) i)) (= (${FUN_APP} (${CAT} s t) (${CAST_INT} i)) (${FUN_APP} t (${CAST_INT} (- i (${PROJ_INT} (${LEN} s))))))) :pattern ((${FUN_APP} (${CAT} s t) (${CAST_INT} i)))))`,
      ),
    ]),
    Append: declareSpec("Append", 2, SEQUENCE_DEPS, [
      axiom(
        "SeqAppendTyping",
        [],
        `(forall ((a Idv) (s Idv) (x Idv)) (! (=> (and (${MEM} s (${SEQ} a)) (${MEM} x a)) (${MEM} (${APPEND} s x) (${SEQ} a))) :pattern ((${MEM} s (${SEQ} a)) (${APPEND} s x))))`,
      ),
      axiom(
        "SeqAppendLen",
        [],
        `(forall ((s Idv) (x Idv)) (! (=> (${MEM} (${LEN} s) ${NAT_SET}) (= (${LEN} (${APPEND} s x)) (${CAST_INT} (+ (${PROJ_INT} (${LEN} s)) 1)))) :pattern ((${APPEND} s x))))`,
      ),
      axiom(
        "SeqAppendApp1",
        [],
        `(forall ((s Idv) (x Idv) (i Int)) (! (=> (and (${MEM} (${LEN} s) ${NAT_SET}) (<= 1 i) (<= i (${PROJ_INT} (${LEN} s)))) (= (${FUN_APP} (${APPEND} s x) (${CAST_INT} i)) (${FUN_APP} s (${CAST_INT} i)))) :pattern ((${FUN_APP} (${APPEND} s x) (${CAST_INT} i))) :pattern ((${APPEND} s x) (${FUN_APP} s (${CAST_INT} i)))))`,
      ),
      axiom(
        "SeqAppendApp2",
        [],
        `(forall ((s Idv) (x Idv)) (! (=> (${MEM} (${LEN} s) ${NAT_SET}) (= (${FUN_APP} (${APPEND} s x) (${CAST_INT} (+ (${PROJ_INT} (${LEN} s)) 1))) x)) :pattern ((${APPEND} s x))))`,
      ),
    ]),
    Head: declareSpec(
      "Head",
      1,
      ["FunApp", "Cast_Int"],
      [
        axiom(
          "SeqHeadDef",
          [],
          `(forall ((s Idv)) (! (= (${HEAD} s) (${FUN_APP} s (${CAST_INT} 1))) :pattern ((${HEAD} s))))`,
        ),
      ],
    ),
    Tail: declareSpec("Tail", 1, SEQUENCE_DEPS, [
      axiom(
        "SeqTailTyping",
        [],
        `(forall ((a Idv) (s Idv)) (! (=> (and (${MEM} s (${SEQ} a)) (distinct (${PROJ_INT} (${LEN} s)) 0)) (${MEM} (${TAIL} s) (${SEQ} a))) :pattern ((${MEM} s (${SEQ} a)) (${TAIL} s))))`,
      ),
      axiom(
        "SeqTailLen",
        [],
        `(forall ((s Idv)) (! (=> (and (${MEM} (${LEN} s) ${NAT_SET}) (distinct (${PROJ_INT} (${LEN} s)) 0)) (= (${LEN} (${TAIL} s)) (${CAST_INT} (- (${PROJ_INT} (${LEN} s)) 1)))) :pattern ((${TAIL} s))))`,
      ),
      axiom(
        "SeqTailApp",
        [],
        `(forall ((s Idv) (i Int)) (! (=> (and (${MEM} (${LEN} s) ${NAT_SET}) (distinct (${PROJ_INT} (${LEN} s)) 0) (<= 1 i) (<= i (- (${PROJ_INT} (${LEN} s)) 1))) (= (${FUN_APP} (${TAIL} s) (${CAST_INT} i)) (${FUN_APP} s (${CAST_INT} (+ i 1))))) :pattern ((${FUN_APP} (${TAIL} s) (${CAST_INT} i)))))`,
      ),
    ]),
    SubSeq: declareSpec(
      "SubSeq",
      3,
      ["Mem", "Seq", "Len", "FunApp", "IntSet", "Cast_Int", "Proj_Int"],
      [
        axiom(
          "SeqSubseqTyping",
          [],
          `(forall ((a Idv) (s Idv) (x Int) (y Int)) (! (=> (or (< y x) (and (${MEM} s (${SEQ} a)) (<= 1 x) (<= y (${PROJ_INT} (${LEN} s))))) (${MEM} ${SUB_SEQ_RANGE} (${SEQ} a))) :pattern ((${MEM} s (${SEQ} a)) ${SUB_SEQ_RANGE})))`,
        ),
        axiom(
          "SeqSubseqLen",
          [],
          `(forall ((s Idv) (x Int) (y Int)) (! (and (=> (<= x (+ y 1)) (= (${LEN} ${SUB_SEQ_RANGE}) (${CAST_INT} (- (+ y 1) x)))) (=> (> x (+ y 1)) (= (${LEN} ${SUB_SEQ_RANGE}) (${CAST_INT} 0)))) :pattern (${SUB_SEQ_RANGE})))`,
        ),
        axiom(
          "SeqSubseqApp",
          [],
          `(forall ((s Idv) (x Int) (y Int) (z Int)) (! (=> (and (<= 1 x) (<= 1 z) (<= z (- (+ y 1) x))) (= (${FUN_APP} ${SUB_SEQ_RANGE} (${CAST_INT} z)) (${FUN_APP} s (${CAST_INT} (- (+ z x) 1))))) :pattern ((${FUN_APP} ${SUB_SEQ_RANGE} (${CAST_INT} z)))))`,
        ),
      ],
    ),
    Cast_Int: createSpec(
      declare(tla("Cast_Int"), 1, "Idv", "Int"),
      ["Mem", "IntSet", "Proj_Int"],
      [
        axiom(
          "CastInjAlt",
          ["Int"],
          `(forall ((x Int)) (! (= x (${PROJ_INT} (${CAST_INT} x))) :pattern ((${CAST_INT} x))))`,
        ),
        axiom(
          "TypeGuardIntro",
          ["Int"],
          `(forall ((z Int)) (! (${MEM} (${CAST_INT} z) ${INT_SET}) :pattern ((${CAST_INT} z))))`,
        ),
        axiom(
          "TypeGuardElim",
          ["Int"],
          `(forall ((x Idv)) (! (=> (${MEM} x ${INT_SET}) (= x (${CAST_INT} (${PROJ_INT} x)))) :pattern ((${MEM} x ${INT_SET}))))`,
        ),
      ],
    ),
    Cast_Bool: createSpec(
      declare(tla("Cast_Bool"), 1, "Idv", "Bool"),
      ["Mem", "BoolSet", "Tt_Idv"],
      [
        axiom(
          "CastInjAlt",
          ["Bool"],
          `(and (= (${CAST_BOOL} true) ${TT_IDV}) (distinct (${CAST_BOOL} false) ${TT_IDV}))`,
        ),
        axiom(
          "TypeGuardIntro",
          ["Bool"],
          `(forall ((z Bool)) (! (${MEM} (${CAST_BOOL} z) ${BOOL_SET}) :pattern ((${CAST_BOOL} z))))`,
        ),
        axiom(
          "TypeGuardElim",
          ["Bool"],
          `(forall ((x Idv)) (! (=> (${MEM} x ${BOOL_SET}) (or (= x (${CAST_BOOL} true)) (= x (${CAST_BOOL} false)))) :pattern ((${MEM} x ${BOOL_SET}))))`,
        ),
      ],
    ),
    Proj_Int: createSpec(declare(tla("Proj_Int"), 1, "Int"), [], []),
    TrigEq_Set$Idv$: declareSpec(
      "TrigEq_Set$Idv$",
      2,
      ["SetExtTrigger"],
      [
        axiom(
          "ExtTrigEqDef",
          ["Set$Idv$"],
          `(forall ((x Idv) (y Idv)) (! (= (${TRIG_EQ} x y) (= x y)) :pattern ((${TRIG_EQ} x y))))`,
        ),
        axiom(
          "ExtTrigEqTrigger",
          ["Idv"],
          `(forall ((x Idv) (y Idv)) (! (${SET_EXT_TRIGGER} x y) :pattern ((${TRIG_EQ} x y))))`,
        ),
      ],
      "Bool",
    ),
    SetExtTrigger: declareSpec("SetExtTrigger", 2, [], [], "Bool"),
    IsSetOf: declareSpec("IsSetOf", 1, [], [], "Bool"),
    BoolSet: declareSpec("BoolSet", 0, [], []),
    StrSet: declareSpec("StrSet", 0, [], []),
    IntSet: declareSpec("IntSet", 0, [], []),
    Tt_Idv: declareSpec("Tt_Idv", 0, [], []),
    TIntLteq: createSpec(undefined, ["IntLteq"], [getTyping("IntLteq")]),
  }),
);

export const getSymbolSpec = (name: string, state: CollectState): SymbolSpec => {
  const symbol = tla(name);
  const enumeration = /^SetEnum_(\d+)$/.exec(name);
  if (enumeration)
    return declareSpec(
      name,
      Number(enumeration[1]),
      ["Mem"],
      getEnumeration(Number(enumeration[1])),
    );
  const setOf = /^SetOf_(\d+)$/.exec(name);
  if (setOf) {
    const count = Number(setOf[1]);
    return createSpec(
      undefined,
      ["Mem", "IsSetOf"],
      [
        axiom("SetOfIntro", [count], undefined),
        axiom("SetOfElim", [count], undefined),
        axiom("AssertIsSetOf", [count], undefined),
        axiom(
          "CompareSetOfTrigger",
          [],
          forall(["a", "b"], `(${SET_EXT_TRIGGER} a b)`, [
            [`(${IS_SET_OF} a)`, `(${IS_SET_OF} b)`],
          ]),
        ),
      ],
    );
  }
  if (name.startsWith("StrLit_")) {
    const value = name.slice("StrLit_".length);
    const distinct = state.strings.map((other) =>
      axiom("StrLitDistinct", [value, other], `(distinct ${symbol} ${tla(`StrLit_${other}`)})`),
    );
    state.strings.push(value);
    return declareSpec(
      name,
      0,
      ["Mem", "StrSet"],
      [axiom("StrLitIsstr", [value], `(${MEM} ${symbol} ${STR_SET})`), ...distinct],
    );
  }
  const tuple = /^Tuple_(\d+)$/.exec(name);
  if (tuple) {
    const count = Number(tuple[1]);
    state.tuples.push(count);
    const deps =
      count === 0
        ? ["FunIsafcn", "Cast_Int", "Seq", "Len"]
        : ["FunIsafcn", "FunDom", "FunApp", `SetEnum_${count}`, "Cast_Int", "Mem", "Seq", "Len"];
    return declareSpec(name, count, deps, getTupleAxioms(count, state.isExcept));
  }
  const product = /^Product_(\d+)$/.exec(name);
  if (product) {
    const count = Number(product[1]);
    return declareSpec(
      name,
      count,
      ["Mem", `Tuple_${count}`, "FunApp", "Cast_Int", "Proj_Int"],
      getComponentSet("Product", [count], symbol, tla(`Tuple_${count}`), getIntegers(count), "t"),
    );
  }
  const fields = state.recordFields.get(name);
  if (fields && name.startsWith("Record_")) {
    state.records.push(fields);
    return declareSpec(
      name,
      fields.length,
      [
        "FunIsafcn",
        "FunDom",
        "FunApp",
        `SetEnum_${fields.length}`,
        ...fields.map((field) => `StrLit_${field}`),
      ],
      getRecordAxioms(fields, state.isExcept),
    );
  }
  if (fields && name.startsWith("RecordSet_")) {
    const record = `Record_${fields.join("_")}`;
    return declareSpec(
      name,
      fields.length,
      ["Mem", record, "FunApp", ...fields.map((field) => `StrLit_${field}`)],
      getComponentSet("RecSet", [fields], symbol, tla(record), getFieldKeys(fields), "r"),
    );
  }
  const anonymous = state.anonymous.get(name);
  if (anonymous !== undefined) return declareSpec(name, anonymous, [], []);
  const known = STATIC_SPECS.get(name);
  if (known) return known;
  const typed = TYPED_OPERATORS[name];
  if (typed)
    return declareSpec(
      name,
      typed[1],
      ["Cast_Int"],
      [getTyping(name)],
      name === "IntLteq" ? "Bool" : "Idv",
    );
  switch (name) {
    case "FunSet":
      state.isFunSet = true;
      return declareSpec(
        name,
        2,
        ["Mem", "FunIsafcn", "FunDom", "FunApp"],
        [
          axiom(
            "FunSetIntro",
            [],
            `(forall ((a Idv) (b Idv) (f Idv)) (! (=> (and (${FUN_ISAFCN} f) (= (${FUN_DOM} f) a) (forall ((x Idv)) (=> (${MEM} x a) (${MEM} (${FUN_APP} f x) b)))) (${MEM} f (${FUN_SET} a b))) :pattern ((${MEM} f (${FUN_SET} a b)))))`,
          ),
          axiom(
            "FunSetElim1",
            [],
            `(forall ((a Idv) (b Idv) (f Idv)) (! (=> (${MEM} f (${FUN_SET} a b)) (and (${FUN_ISAFCN} f) (= (${FUN_DOM} f) a))) :pattern ((${MEM} f (${FUN_SET} a b)))))`,
          ),
          axiom(
            "FunSetElim2",
            [],
            `(forall ((a Idv) (b Idv) (f Idv) (x Idv)) (! (=> (and (${MEM} f (${FUN_SET} a b)) (${MEM} x a)) (${MEM} (${FUN_APP} f x) b)) :pattern ((${MEM} f (${FUN_SET} a b)) (${MEM} x a)) :pattern ((${MEM} f (${FUN_SET} a b)) (${FUN_APP} f x))))`,
          ),
          ...(state.isFunConstr ? [axiom("FunTyping", [], undefined)] : []),
        ],
      );
    case "FunFcn":
      state.isFunConstr = true;
      return createSpec(
        undefined,
        ["FunIsafcn"],
        [
          axiom("FunConstrIsafcn", [], undefined),
          ...(state.isFunSet ? [axiom("FunTyping", [], undefined)] : []),
        ],
      );
    case "FunExcept": {
      state.isExcept = true;
      const updated = `(${FUN_EXCEPT} f x y)`;
      return declareSpec(
        name,
        3,
        ["Mem", "FunIsafcn", "FunDom", "FunApp"],
        [
          axiom(
            "FunExceptIsafcn",
            [],
            `(forall ((f Idv) (x Idv) (y Idv)) (! (${FUN_ISAFCN} ${updated}) :pattern (${updated})))`,
          ),
          axiom(
            "FunExceptDomDef",
            [],
            `(forall ((f Idv) (x Idv) (y Idv)) (! (= (${FUN_DOM} ${updated}) (${FUN_DOM} f)) :pattern (${updated})))`,
          ),
          axiom(
            "FunExceptAppDef1",
            [],
            `(forall ((f Idv) (x Idv) (y Idv)) (! (=> (${MEM} x (${FUN_DOM} f)) (= (${FUN_APP} ${updated} x) y)) :pattern (${updated})))`,
          ),
          axiom(
            "FunExceptAppDef2",
            [],
            `(forall ((f Idv) (x Idv) (y Idv) (z Idv)) (! (=> (${MEM} z (${FUN_DOM} f)) (and (=> (= z x) (= (${FUN_APP} ${updated} z) y)) (=> (distinct z x) (= (${FUN_APP} ${updated} z) (${FUN_APP} f z))))) :pattern ((${FUN_APP} ${updated} z)) :pattern (${updated} (${FUN_APP} f z))))`,
          ),
          ...state.tuples.flatMap(getTupleExcepts),
          ...state.records.flatMap(getRecordExcepts),
        ],
      );
    }
    default:
      if (name.startsWith("TIntLit_")) return createSpec(undefined, [], []);
      throw new TlaUnsupportedError(`the symbol ${name}`);
  }
};
