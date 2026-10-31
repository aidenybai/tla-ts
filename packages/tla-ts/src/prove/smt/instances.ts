// Flatten.instantiate: the axioms of encode/n_axioms.ml for a second-order construct, instantiated
// for one flattened symbol. Each takes the symbol's name, the bound variables its argument uses,
// which become its last arguments, and the argument's text with the variable it binds.

import {
  APPEND,
  call,
  conjoin,
  forall,
  FUN_APP,
  FUN_DOM,
  FUN_ISAFCN,
  FUN_SET,
  getNames,
  IS_SET_OF,
  LEN,
  MEM,
  NAT_SET,
  PROJ_INT,
  replaceToken,
  SEQ,
  TUPLE_0,
} from "./format";
import { axiom, getAxiomKey } from "./table";

// SetStDef for { x \in a : body }.
export const getSetStAxioms = (name: string, free: string[], body: string, variable: string) => {
  const set = call(name, ["a", ...free]);
  return [
    axiom(
      "SetStDef",
      [],
      forall(
        [...free, "a", "x"],
        `(= (${MEM} x ${set}) (and (${MEM} x a) ${replaceToken(body, variable, "x")}))`,
        [[`(${MEM} x ${set})`], [`(${MEM} x a)`, set]],
      ),
    ),
  ];
};

// SetOfIntro, SetOfElim, and AssertIsSetOf for { element : y1 \in a1, ..., yn \in an }.
export const getSetOfAxioms = (name: string, free: string[], element: string, bound: string[]) => {
  const count = bound.length;
  const sets = getNames("a", count);
  const variables = getNames("y", count);
  const value = bound.reduce(
    (text, variable, index) => replaceToken(text, variable, variables[index]),
    element,
  );
  const set = call(name, [...sets, ...free]);
  const guards = variables.map((variable, index) => `(${MEM} ${variable} ${sets[index]})`);
  const binders = variables.map((variable) => `(${variable} Idv)`).join(" ");
  // N_axioms.assert_issetof names its one set a.
  const single = count === 1 ? ["a"] : sets;
  return [
    axiom(
      "SetOfIntro",
      [count],
      forall([...free, ...sets, ...variables], `(=> ${conjoin(guards)} (${MEM} ${value} ${set}))`, [
        [value, set],
        [set, ...guards],
      ]),
    ),
    axiom(
      "SetOfElim",
      [count],
      forall(
        [...free, ...sets, "x"],
        `(=> (${MEM} x ${set}) (exists (${binders}) ${conjoin([...guards, `(= x ${value})`])}))`,
        [[`(${MEM} x ${set})`]],
      ),
    ),
    axiom(
      "AssertIsSetOf",
      [count],
      forall([...free, ...single], `(${IS_SET_OF} ${call(name, [...single, ...free])})`, [
        [call(name, [...single, ...free])],
      ]),
    ),
  ];
};

// FunConstrIsafcn, FunDomDef, FunAppDef, and FunTyping when collect brought it, for
// [x \in a |-> body].
export const getFunctionAxioms = (
  name: string,
  free: string[],
  body: string,
  variable: string,
  axioms: Set<string>,
) => {
  const value = call(name, ["a", ...free]);
  const result = replaceToken(body, variable, "x");
  const typing = axioms.has(getAxiomKey(axiom("FunTyping", [], undefined)))
    ? [
        axiom(
          "FunTyping",
          [],
          forall(
            [...free, "a", "b"],
            `(=> (forall ((x Idv)) (=> (${MEM} x a) (${MEM} ${result} b))) (${MEM} ${value} (${FUN_SET} a b)))`,
            [[value, `(${FUN_SET} a b)`]],
          ),
        ),
      ]
    : [];
  return [
    axiom("FunConstrIsafcn", [], forall([...free, "a"], `(${FUN_ISAFCN} ${value})`, [[value]])),
    axiom("FunDomDef", [], forall([...free, "a"], `(= (${FUN_DOM} ${value}) a)`, [[value]])),
    axiom(
      "FunAppDef",
      [],
      forall([...free, "a", "x"], `(=> (${MEM} x a) (= (${FUN_APP} ${value} x) ${result}))`, [
        [`(${FUN_APP} ${value} x)`],
        [`(${MEM} x a)`, value],
      ]),
    ),
    ...typing,
  ];
};

// ChooseDef for CHOOSE x : body.
export const getChooseAxioms = (name: string, free: string[], body: string, variable: string) => [
  axiom(
    "ChooseDef",
    [],
    forall(
      [...free, "x"],
      `(=> ${replaceToken(body, variable, "x")} ${replaceToken(body, variable, call(name, free))})`,
    ),
  ),
];

// The SeqSelectseq axioms for SelectSeq(s, LAMBDA x : body).
export const getSelectSeqAxioms = (
  name: string,
  free: string[],
  body: string,
  variable: string,
) => {
  const select = (sequence: string) => call(name, [sequence, ...free]);
  const test = (term: string) => replaceToken(body, variable, term);
  const appended = select(`(${APPEND} s x)`);
  return [
    axiom(
      "SeqSelectseqTyping",
      [],
      forall([...free, "a", "s"], `(=> (${MEM} s (${SEQ} a)) (${MEM} ${select("s")} (${SEQ} a)))`, [
        [`(${MEM} s (${SEQ} a))`, select("s")],
      ]),
    ),
    axiom(
      "SeqSelectseqLen",
      [],
      forall(
        [...free, "s"],
        `(=> (${MEM} (${LEN} s) ${NAT_SET}) (<= (${PROJ_INT} (${LEN} ${select("s")})) (${PROJ_INT} (${LEN} s))))`,
        [[select("s")]],
      ),
    ),
    axiom("SeqSelectseqNil", [], forall(free, `(= ${select(TUPLE_0)} ${TUPLE_0})`)),
    axiom(
      "SeqSelectseqApp",
      [],
      forall(
        [...free, "s", "x"],
        `(=> (${MEM} x (${FUN_DOM} ${select("s")})) ${test(`(${FUN_APP} ${select("s")} x)`)})`,
        [[`(${FUN_APP} ${select("s")} x)`]],
      ),
    ),
    axiom(
      "SeqSelectseqAppend",
      [],
      forall(
        [...free, "s", "x"],
        `(and (=> ${test("x")} (= ${appended} (${APPEND} ${select("s")} x))) (=> (not ${test("x")}) (= ${appended} ${select("s")})))`,
        [[appended]],
      ),
    ),
  ];
};
