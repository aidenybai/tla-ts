// N_data.untyped_deps and N_axioms with disable_arithmetic, where integers are values of sort Idv
// that only these axioms describe.

import {
  APPEND,
  CAT,
  declare,
  FUN_APP,
  FUN_DOM,
  FUN_ISAFCN,
  HEAD,
  INT_LTEQ,
  INT_MINUS,
  INT_PLUS,
  INT_RANGE,
  INT_SET,
  LEN,
  MEM,
  NAT_SET,
  SEQ,
  SUB_SEQ,
  TAIL,
  tla,
} from "./format";
import type { SymbolSpec } from "./data";
import { axiom, type Axiom } from "./table";

const ZERO = tla("IntLit_0");
const ONE = tla("IntLit_1");

const SEQUENCE_DEPS = ["Mem", "Seq", "Len", "FunApp", "IntSet", "NatSet", "IntPlus", "IntLteq"];

const getTyping = (name: string, operator: string, set: string) =>
  axiom(
    name,
    [],
    `(forall ((x Idv) (y Idv)) (! (=> (and (${MEM} x ${set}) (${MEM} y ${set})) (${MEM} (${operator} x y) ${set})) :pattern ((${operator} x y))))`,
  );

export const getUntypedSpec = (name: string): SymbolSpec | undefined => {
  const symbol = tla(name);
  const fixed = (arity: number, deps: string[], axioms: Axiom[], sort = "Idv") => ({
    declaration: declare(symbol, arity, sort),
    deps,
    axioms,
  });
  switch (name) {
    case "NatSet":
      return fixed(
        0,
        ["IntSet", "IntLit_0", "IntLteq"],
        [
          axiom(
            "NatSetDef",
            [],
            `(forall ((x Idv)) (! (= (${MEM} x ${NAT_SET}) (and (${MEM} x ${INT_SET}) (${INT_LTEQ} ${ZERO} x))) :pattern ((${MEM} x ${NAT_SET}))))`,
          ),
        ],
      );
    case "IntPlus":
    case "IntTimes": {
      const typing = name === "IntPlus" ? "Plus" : "Times";
      return fixed(
        2,
        ["Mem", "IntSet", "NatSet"],
        [
          getTyping(`Int${typing}Typing`, symbol, INT_SET),
          getTyping(`Nat${typing}Typing`, symbol, NAT_SET),
        ],
      );
    }
    case "IntMinus":
      return fixed(2, ["Mem", "IntSet"], [getTyping("IntMinusTyping", symbol, INT_SET)]);
    case "IntUminus":
      return fixed(
        1,
        ["Mem", "IntSet"],
        [
          axiom(
            "IntUminusTyping",
            [],
            `(forall ((x Idv)) (! (=> (${MEM} x ${INT_SET}) (${MEM} (${symbol} x) ${INT_SET})) :pattern ((${symbol} x))))`,
          ),
        ],
      );
    case "IntQuotient":
    case "IntRemainder": {
      const isQuotient = name === "IntQuotient";
      return fixed(
        2,
        isQuotient
          ? ["Mem", "IntSet", "NatSet", "IntLteq", "IntLit_0"]
          : ["Mem", "IntSet", "NatSet", "IntLteq", "IntLit_0", "IntLit_1", "IntRange", "IntMinus"],
        [
          axiom(
            `${name}Typing`,
            [],
            `(forall ((x Idv) (y Idv)) (! (=> (and (${MEM} x ${INT_SET}) (${MEM} y ${NAT_SET}) (${INT_LTEQ} ${ZERO} y)) (${MEM} (${symbol} x y) ${isQuotient ? NAT_SET : `(${INT_RANGE} ${ZERO} (${INT_MINUS} y ${ONE}))`})) :pattern ((${symbol} x y))))`,
          ),
        ],
      );
    }
    case "IntExp":
      return fixed(
        2,
        ["Mem", "IntSet", "IntLteq", "IntLit_0", "IntLit_1"],
        [
          axiom(
            "IntExpTyping",
            [],
            `(forall ((x Idv) (y Idv)) (! (=> (and (${MEM} x ${INT_SET}) (${MEM} y ${INT_SET}) (${INT_LTEQ} ${ZERO} y) (or (distinct x ${ZERO}) (${INT_LTEQ} ${ONE} y))) (${MEM} (${symbol} x y) ${INT_SET})) :pattern ((${symbol} x y))))`,
          ),
        ],
      );
    case "IntLteq":
      return fixed(
        2,
        ["Mem", "IntSet"],
        [
          axiom(
            "LteqReflexive",
            [],
            `(forall ((x Idv)) (=> (${MEM} x ${INT_SET}) (${INT_LTEQ} x x)))`,
          ),
          axiom(
            "LteqTransitive",
            [],
            `(forall ((x Idv) (y Idv) (z Idv)) (=> (and (${MEM} x ${INT_SET}) (${MEM} y ${INT_SET}) (${MEM} z ${INT_SET}) (${INT_LTEQ} x y) (${INT_LTEQ} y z)) (${INT_LTEQ} x z)))`,
          ),
          axiom(
            "LteqAntisym",
            [],
            `(forall ((x Idv) (y Idv)) (=> (and (${MEM} x ${INT_SET}) (${MEM} y ${INT_SET}) (${INT_LTEQ} x y) (${INT_LTEQ} y x)) (= x y)))`,
          ),
        ],
        "Bool",
      );
    // tlapm labels SeqSetElim1 and SeqSetElim2 SetSetElim1 and SetSetElim2.
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
          "IntLteq",
          "IntLit_1",
        ],
        [
          axiom(
            "SeqSetIntro",
            [],
            `(forall ((a Idv) (s Idv)) (! (=> (and (${FUN_ISAFCN} s) (${MEM} (${LEN} s) ${NAT_SET}) (forall ((i Idv)) (= (${MEM} i (${FUN_DOM} s)) (and (${MEM} i ${INT_SET}) (${INT_LTEQ} ${ONE} i) (${INT_LTEQ} i (${LEN} s))))) (forall ((i Idv)) (=> (and (${MEM} i ${INT_SET}) (${INT_LTEQ} ${ONE} i) (${INT_LTEQ} i (${LEN} s))) (${MEM} (${FUN_APP} s i) a)))) (${MEM} s (${SEQ} a))) :pattern ((${MEM} s (${SEQ} a)))))`,
          ),
          axiom(
            "SeqSetElim1",
            [],
            `(forall ((a Idv) (s Idv)) (! (=> (${MEM} s (${SEQ} a)) (and (${FUN_ISAFCN} s) (${MEM} (${LEN} s) ${NAT_SET}) (= (${FUN_DOM} s) (${INT_RANGE} ${ONE} (${LEN} s))))) :pattern ((${MEM} s (${SEQ} a)))))`,
            "SetSetElim1",
          ),
          axiom(
            "SeqSetElim2",
            [],
            `(forall ((a Idv) (s Idv) (i Idv)) (! (=> (and (${MEM} s (${SEQ} a)) (${MEM} i ${INT_SET}) (${INT_LTEQ} ${ONE} i) (${INT_LTEQ} i (${LEN} s))) (${MEM} (${FUN_APP} s i) a)) :pattern ((${MEM} s (${SEQ} a)) (${FUN_APP} s i))))`,
            "SetSetElim2",
          ),
        ],
      );
    case "Len":
      return fixed(
        1,
        ["Mem", "FunDom", "IntRange", "NatSet", "IntLit_1"],
        [
          axiom(
            "SeqLenDef",
            [],
            `(forall ((s Idv) (z Idv)) (=> (and (${MEM} z ${NAT_SET}) (= (${FUN_DOM} s) (${INT_RANGE} ${ONE} z))) (= (${LEN} s) z)))`,
          ),
        ],
      );
    case "Cat":
      return fixed(
        2,
        [...SEQUENCE_DEPS, "IntLit_1"],
        [
          axiom(
            "SeqCatTyping",
            [],
            `(forall ((a Idv) (s Idv) (t Idv)) (! (=> (and (${MEM} s (${SEQ} a)) (${MEM} t (${SEQ} a))) (${MEM} (${CAT} s t) (${SEQ} a))) :pattern ((${MEM} s (${SEQ} a)) (${CAT} s t)) :pattern ((${MEM} t (${SEQ} a)) (${CAT} s t))))`,
          ),
          axiom(
            "SeqCatLen",
            [],
            `(forall ((s Idv) (t Idv)) (! (=> (and (${MEM} (${LEN} s) ${NAT_SET}) (${MEM} (${LEN} t) ${NAT_SET})) (= (${LEN} (${CAT} s t)) (${INT_PLUS} (${LEN} s) (${LEN} t)))) :pattern ((${CAT} s t))))`,
          ),
          axiom(
            "SeqCatApp1",
            [],
            `(forall ((s Idv) (t Idv) (i Idv)) (! (=> (and (${MEM} (${LEN} s) ${NAT_SET}) (${MEM} (${LEN} t) ${NAT_SET}) (${MEM} i ${INT_SET}) (${INT_LTEQ} ${ONE} i) (${INT_LTEQ} i (${LEN} s))) (= (${FUN_APP} (${CAT} s t) i) (${FUN_APP} s i))) :pattern ((${FUN_APP} (${CAT} s t) i)) :pattern ((${CAT} s t) (${FUN_APP} s i))))`,
          ),
          axiom(
            "SeqCatApp2",
            [],
            `(forall ((s Idv) (t Idv) (i Idv)) (! (=> (and (${MEM} (${LEN} s) ${NAT_SET}) (${MEM} (${LEN} t) ${NAT_SET}) (${MEM} i ${INT_SET}) (${INT_LTEQ} i (${INT_PLUS} (${LEN} s) (${LEN} t))) (${INT_LTEQ} (${LEN} s) i) (distinct (${LEN} s) i)) (= (${FUN_APP} (${CAT} s t) i) (${FUN_APP} t (${INT_MINUS} i (${LEN} s))))) :pattern ((${FUN_APP} (${CAT} s t) i))))`,
          ),
        ],
      );
    case "Append":
      return fixed(
        2,
        [...SEQUENCE_DEPS, "IntLit_1"],
        [
          axiom(
            "SeqAppendTyping",
            [],
            `(forall ((a Idv) (s Idv) (x Idv)) (! (=> (and (${MEM} s (${SEQ} a)) (${MEM} x a)) (${MEM} (${APPEND} s x) (${SEQ} a))) :pattern ((${MEM} s (${SEQ} a)) (${APPEND} s x))))`,
          ),
          axiom(
            "SeqAppendLen",
            [],
            `(forall ((s Idv) (x Idv)) (! (=> (${MEM} (${LEN} s) ${NAT_SET}) (= (${LEN} (${APPEND} s x)) (${INT_PLUS} (${LEN} s) ${ONE}))) :pattern ((${APPEND} s x))))`,
          ),
          axiom(
            "SeqAppendApp1",
            [],
            `(forall ((s Idv) (x Idv) (i Idv)) (! (=> (and (${MEM} (${LEN} s) ${NAT_SET}) (${MEM} i ${INT_SET}) (${INT_LTEQ} ${ONE} i) (${INT_LTEQ} i (${LEN} s))) (= (${FUN_APP} (${APPEND} s x) i) (${FUN_APP} s i))) :pattern ((${FUN_APP} (${APPEND} s x) i)) :pattern ((${APPEND} s x) (${FUN_APP} s i))))`,
          ),
          axiom(
            "SeqAppendApp2",
            [],
            `(forall ((s Idv) (x Idv)) (! (=> (${MEM} (${LEN} s) ${NAT_SET}) (= (${FUN_APP} (${APPEND} s x) (${INT_PLUS} (${LEN} s) ${ONE})) x)) :pattern ((${APPEND} s x))))`,
          ),
        ],
      );
    case "Head":
      return fixed(
        1,
        ["FunApp", "IntLit_1"],
        [
          axiom(
            "SeqHeadDef",
            [],
            `(forall ((s Idv)) (! (= (${HEAD} s) (${FUN_APP} s ${ONE})) :pattern ((${HEAD} s))))`,
          ),
        ],
      );
    case "Tail":
      return fixed(
        1,
        [...SEQUENCE_DEPS, "IntMinus", "IntLit_0", "IntLit_1"],
        [
          axiom(
            "SeqTailTyping",
            [],
            `(forall ((a Idv) (s Idv)) (! (=> (and (${MEM} s (${SEQ} a)) (distinct (${LEN} s) ${ZERO})) (${MEM} (${TAIL} s) (${SEQ} a))) :pattern ((${MEM} s (${SEQ} a)) (${TAIL} s))))`,
          ),
          axiom(
            "SeqTailLen",
            [],
            `(forall ((s Idv)) (! (=> (and (${MEM} (${LEN} s) ${NAT_SET}) (distinct (${LEN} s) ${ZERO})) (= (${LEN} (${TAIL} s)) (${INT_MINUS} (${LEN} s) ${ONE}))) :pattern ((${TAIL} s))))`,
          ),
          axiom(
            "SeqTailApp",
            [],
            `(forall ((s Idv) (i Idv)) (! (=> (and (${MEM} (${LEN} s) ${NAT_SET}) (distinct (${LEN} s) ${ZERO}) (${MEM} i ${INT_SET}) (${INT_LTEQ} ${ONE} i) (${INT_LTEQ} i (${INT_MINUS} (${LEN} s) ${ONE}))) (= (${FUN_APP} (${TAIL} s) i) (${FUN_APP} s (${INT_PLUS} i ${ONE})))) :pattern ((${FUN_APP} (${TAIL} s) i))))`,
          ),
        ],
      );
    case "SubSeq":
      return fixed(
        3,
        [
          "Mem",
          "Seq",
          "Len",
          "FunApp",
          "IntSet",
          "IntPlus",
          "IntMinus",
          "IntLteq",
          "IntLit_0",
          "IntLit_1",
        ],
        [
          axiom(
            "SeqSubseqTyping",
            [],
            `(forall ((a Idv) (s Idv) (x Idv) (y Idv)) (! (=> (or (and (${MEM} x ${INT_SET}) (${MEM} y ${INT_SET}) (${INT_LTEQ} y x) (distinct y x)) (and (${MEM} s (${SEQ} a)) (${MEM} x ${INT_SET}) (${MEM} y ${INT_SET}) (${INT_LTEQ} ${ONE} x) (${INT_LTEQ} y (${LEN} s)))) (${MEM} (${SUB_SEQ} s x y) (${SEQ} a))) :pattern ((${MEM} s (${SEQ} a)) (${SUB_SEQ} s x y))))`,
          ),
          axiom(
            "SeqSubseqLen",
            [],
            `(forall ((s Idv) (x Idv) (y Idv)) (! (=> (and (${MEM} x ${INT_SET}) (${MEM} y ${INT_SET})) (and (=> (${INT_LTEQ} x (${INT_PLUS} y ${ONE})) (= (${LEN} (${SUB_SEQ} s x y)) (${INT_MINUS} (${INT_PLUS} y ${ONE}) x))) (=> (not (${INT_LTEQ} x (${INT_PLUS} y ${ONE}))) (= (${LEN} (${SUB_SEQ} s x y)) ${ZERO})))) :pattern ((${SUB_SEQ} s x y))))`,
          ),
          axiom(
            "SeqSubseqApp",
            [],
            `(forall ((s Idv) (x Idv) (y Idv) (z Idv)) (! (=> (and (${MEM} x ${INT_SET}) (${MEM} y ${INT_SET}) (${MEM} z ${INT_SET}) (${INT_LTEQ} ${ONE} x) (${INT_LTEQ} ${ONE} z) (${INT_LTEQ} z (${INT_MINUS} (${INT_PLUS} y ${ONE}) x))) (= (${FUN_APP} (${SUB_SEQ} s x y) z) (${FUN_APP} s (${INT_MINUS} (${INT_PLUS} z x) ${ONE})))) :pattern ((${FUN_APP} (${SUB_SEQ} s x y) z))))`,
          ),
        ],
      );
    default:
      return undefined;
  }
};
