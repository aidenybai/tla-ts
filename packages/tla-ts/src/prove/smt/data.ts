// encode/n_data.ml: the declaration, dependencies, and axioms of each symbol tlapm's SMT encoding
// uses.

import { TlaUnsupportedError } from "../../errors";
import {
  TYPINGS,
  getEnumeration,
  getIntegers,
  getTupleAxioms,
  getRecordAxioms,
  getComponentExcept,
  getComponentSet,
} from "./axioms";
import {
  APPEND,
  BOOL_SET,
  CAP,
  CAST_BOOL,
  CAST_INT,
  CAT,
  declare,
  formatName,
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

// N_data.s: what the symbols collected so far change about the axioms of the next ones.
export interface CollectState {
  // The fields of each record symbol the obligation uses.
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

// N_data.get_deps, with arithmetic and set extensionality as tlapm's SMT backend sets them.
export const getSymbolSpec = (name: string, state: CollectState): SymbolSpec => {
  const spec = (declaration: string | undefined, deps: string[], axioms: Axiom[]) => ({
    declaration,
    deps,
    axioms,
  });
  const symbol = formatName(`TLA__${name}`);
  const fixed = (arity: number, deps: string[], axioms: Axiom[], sort = "Idv") =>
    spec(declare(symbol, arity, sort), deps, axioms);
  const enumeration = /^SetEnum_(\d+)$/.exec(name);
  if (enumeration)
    return fixed(Number(enumeration[1]), ["Mem"], getEnumeration(Number(enumeration[1])));
  const setOf = /^SetOf_(\d+)$/.exec(name);
  if (setOf) {
    const count = Number(setOf[1]);
    return spec(
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
    return fixed(
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
    return fixed(count, deps, getTupleAxioms(count, state.isExcept));
  }
  const product = /^Product_(\d+)$/.exec(name);
  if (product) {
    const count = Number(product[1]);
    return fixed(
      count,
      ["Mem", `Tuple_${count}`, "FunApp", "Cast_Int", "Proj_Int"],
      getComponentSet("Product", [count], symbol, tla(`Tuple_${count}`), getIntegers(count), "t"),
    );
  }
  const fields = state.recordFields.get(name);
  if (fields && name.startsWith("Record_")) {
    state.records.push(fields);
    return fixed(
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
    return fixed(
      fields.length,
      ["Mem", record, "FunApp", ...fields.map((field) => `StrLit_${field}`)],
      getComponentSet(
        "RecSet",
        [fields],
        symbol,
        tla(record),
        fields.map((field) => tla(`StrLit_${field}`)),
        "r",
      ),
    );
  }
  const anonymous = state.anonymous.get(name);
  if (anonymous !== undefined) return fixed(anonymous, [], []);
  const typing = TYPINGS[name];
  if (typing)
    return fixed(
      name === "IntUminus" ? 1 : 2,
      ["Cast_Int"],
      [typing()],
      name === "IntLteq" ? "Bool" : "Idv",
    );
  switch (name) {
    // SMT-LIB has no exponentiation, so IntExp keeps only its typing.
    case "IntExp":
      return fixed(
        2,
        ["Mem", "IntSet", "Cast_Int", "TIntLteq", "TIntLit_0", "TIntLit_1"],
        [
          axiom(
            "IntExpTyping",
            [],
            `(forall ((x Idv) (y Idv)) (! (=> (and (${MEM} x ${INT_SET}) (${MEM} y ${INT_SET}) (or (distinct x (${CAST_INT} 0)) (${INT_LTEQ} (${CAST_INT} 1) y))) (${MEM} (${symbol} x y) ${INT_SET})) :pattern ((${symbol} x y))))`,
          ),
        ],
      );
    case "SelectSeq":
      return spec(
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
      );
    case "Choose":
      return spec(undefined, [], [axiom("ChooseDef", [], undefined)]);
    case "Mem":
      return fixed(
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
      );
    case "SubsetEq":
      return fixed(
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
      );
    case "Union":
      return fixed(
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
      );
    case "Subset":
      return fixed(
        1,
        ["Mem", "SubsetEq"],
        [
          axiom(
            "SubsetDefAlt",
            [],
            `(forall ((a Idv) (x Idv)) (! (= (${MEM} x (${SUBSET} a)) (${SUBSET_EQ} x a)) :pattern ((${MEM} x (${SUBSET} a))) :pattern ((${SUBSET_EQ} x a) (${SUBSET} a))))`,
          ),
        ],
      );
    case "Cup":
    case "Cap":
    case "SetMinus": {
      const condition =
        name === "Cup"
          ? "(or (MEM x a) (MEM x b))"
          : name === "Cap"
            ? "(and (MEM x a) (MEM x b))"
            : "(and (MEM x a) (not (MEM x b)))";
      const definition = axiom(
        `${name}Def`,
        [],
        `(forall ((a Idv) (b Idv) (x Idv)) (! (= (${MEM} x (${symbol} a b)) ${condition.replaceAll("MEM", MEM)}) :pattern ((${MEM} x (${symbol} a b))) :pattern ((${MEM} x a) (${symbol} a b)) :pattern ((${MEM} x b) (${symbol} a b))))`,
      );
      if (name !== "Cap") return fixed(2, ["Mem"], [definition]);
      return fixed(
        2,
        ["Mem", "SetEnum_0", "SetExtTrigger"],
        [
          definition,
          axiom(
            "DisjointTrigger",
            [],
            `(forall ((x Idv) (y Idv)) (! (${SET_EXT_TRIGGER} (${CAP} x y) ${tla("SetEnum_0")}) :pattern ((${CAP} x y))))`,
          ),
        ],
      );
    }
    case "SetSt":
      return spec(
        undefined,
        ["Mem", "SetEnum_0", "SetExtTrigger"],
        [axiom("SetStDef", [], undefined), axiom("EmptyComprehensionTrigger", [], undefined)],
      );
    case "NatSet":
      return fixed(
        0,
        ["IntSet", "TIntLit_0", "Cast_Int", "IntLteq"],
        [
          axiom(
            "NatSetDef",
            [],
            `(forall ((x Idv)) (! (= (${MEM} x ${NAT_SET}) (and (${MEM} x ${INT_SET}) (${INT_LTEQ} (${CAST_INT} 0) x))) :pattern ((${MEM} x ${NAT_SET}))))`,
          ),
        ],
      );
    case "IntRange":
      return fixed(
        2,
        ["Mem", "IntSet", "IntLteq"],
        [
          axiom(
            "IntRangeDef",
            [],
            `(forall ((a Idv) (b Idv) (x Idv)) (! (= (${MEM} x (${INT_RANGE} a b)) (and (${MEM} x ${INT_SET}) (${INT_LTEQ} a x) (${INT_LTEQ} x b))) :pattern ((${MEM} x (${INT_RANGE} a b)))))`,
          ),
        ],
      );
    case "FunIsafcn":
      return fixed(
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
      );
    case "FunSet":
      state.isFunSet = true;
      return fixed(
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
      return spec(
        undefined,
        ["FunIsafcn"],
        [
          axiom("FunConstrIsafcn", [], undefined),
          ...(state.isFunSet ? [axiom("FunTyping", [], undefined)] : []),
        ],
      );
    case "FunDom":
      return fixed(1, ["FunFcn"], [axiom("FunDomDef", [], undefined)]);
    case "FunApp":
      return fixed(2, ["Mem", "FunFcn"], [axiom("FunAppDef", [], undefined)]);
    case "FunExcept": {
      state.isExcept = true;
      const updated = `(${FUN_EXCEPT} f x y)`;
      return fixed(
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
          ...state.tuples.flatMap((count) =>
            getIntegers(count).map((_key, index) =>
              getComponentExcept(
                "TupExcept",
                [count],
                tla(`Tuple_${count}`),
                getIntegers(count),
                index,
              ),
            ),
          ),
          ...state.records.flatMap((recordFields) =>
            recordFields.map((_field, index) =>
              getComponentExcept(
                "RecExcept",
                [recordFields],
                tla(`Record_${recordFields.join("_")}`),
                recordFields.map((field) => tla(`StrLit_${field}`)),
                index,
              ),
            ),
          ),
        ],
      );
    }
    case "Seq":
      return fixed(
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
      );
    case "Len":
      return fixed(
        1,
        ["FunDom", "IntRange", "Cast_Int"],
        [
          axiom(
            "SeqLenDef",
            [],
            `(forall ((s Idv) (z Int)) (=> (and (>= z 0) (= (${FUN_DOM} s) (${INT_RANGE} (${CAST_INT} 1) (${CAST_INT} z)))) (= (${LEN} s) (${CAST_INT} z))))`,
          ),
        ],
      );
    case "BSeq":
      return fixed(1, [], []);
    case "Cat":
      return fixed(2, SEQUENCE_DEPS, [
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
      ]);
    case "Append":
      return fixed(2, SEQUENCE_DEPS, [
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
      ]);
    case "Head":
      return fixed(
        1,
        ["FunApp", "Cast_Int"],
        [
          axiom(
            "SeqHeadDef",
            [],
            `(forall ((s Idv)) (! (= (${HEAD} s) (${FUN_APP} s (${CAST_INT} 1))) :pattern ((${HEAD} s))))`,
          ),
        ],
      );
    case "Tail":
      return fixed(1, SEQUENCE_DEPS, [
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
      ]);
    case "SubSeq": {
      const range = `(${SUB_SEQ} s (${CAST_INT} x) (${CAST_INT} y))`;
      return fixed(
        3,
        ["Mem", "Seq", "Len", "FunApp", "IntSet", "Cast_Int", "Proj_Int"],
        [
          axiom(
            "SeqSubseqTyping",
            [],
            `(forall ((a Idv) (s Idv) (x Int) (y Int)) (! (=> (or (< y x) (and (${MEM} s (${SEQ} a)) (<= 1 x) (<= y (${PROJ_INT} (${LEN} s))))) (${MEM} ${range} (${SEQ} a))) :pattern ((${MEM} s (${SEQ} a)) ${range})))`,
          ),
          axiom(
            "SeqSubseqLen",
            [],
            `(forall ((s Idv) (x Int) (y Int)) (! (and (=> (<= x (+ y 1)) (= (${LEN} ${range}) (${CAST_INT} (- (+ y 1) x)))) (=> (> x (+ y 1)) (= (${LEN} ${range}) (${CAST_INT} 0)))) :pattern (${range})))`,
          ),
          axiom(
            "SeqSubseqApp",
            [],
            `(forall ((s Idv) (x Int) (y Int) (z Int)) (! (=> (and (<= 1 x) (<= 1 z) (<= z (- (+ y 1) x))) (= (${FUN_APP} ${range} (${CAST_INT} z)) (${FUN_APP} s (${CAST_INT} (- (+ z x) 1))))) :pattern ((${FUN_APP} ${range} (${CAST_INT} z)))))`,
          ),
        ],
      );
    }
    case "Cast_Int":
      return spec(
        declare(symbol, 1, "Idv", "Int"),
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
      );
    case "Cast_Bool":
      return spec(
        declare(symbol, 1, "Idv", "Bool"),
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
      );
    case "Proj_Int":
      return spec(declare(symbol, 1, "Int"), [], []);
    case "TrigEq_Set$Idv$":
      return fixed(
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
      );
    case "SetExtTrigger":
    case "IsSetOf":
      return fixed(name === "IsSetOf" ? 1 : 2, [], [], "Bool");
    case "BoolSet":
    case "StrSet":
    case "IntSet":
    case "Tt_Idv":
      return fixed(0, [], []);
    case "TIntLteq":
      return spec(undefined, ["IntLteq"], [TYPINGS.IntLteq()]);
    default:
      // The rest are numerals, which SMT-LIB has natively.
      if (name.startsWith("TIntLit_")) return spec(undefined, [], []);
      throw new TlaUnsupportedError(`the symbol ${name}`);
  }
};
