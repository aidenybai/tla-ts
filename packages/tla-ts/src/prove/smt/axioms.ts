// encode/n_axioms.ml: the formulas of the axioms that depend on a count or on fields.

import {
  call,
  CAST_INT,
  conjoin,
  disjoin,
  forall,
  FUN_APP,
  FUN_DOM,
  FUN_EXCEPT,
  FUN_ISAFCN,
  getNames,
  LEN,
  MEM,
  SEQ,
  tla,
} from "./format";
import { axiom, TYPED_SYMBOLS, type Axiom, type AxiomArgument } from "./table";

export const getTyping = (name: string, operator: string, arity: number, isGuarded = false) => {
  const symbol = tla(name);
  const variables = arity === 1 ? ["x1"] : isGuarded ? ["x", "y"] : ["x1", "x2"];
  const left = call(
    symbol,
    variables.map((variable) => `(${CAST_INT} ${variable})`),
  );
  const right =
    operator === "<="
      ? `(<= ${variables.join(" ")})`
      : `(${CAST_INT} (${operator} ${variables.join(" ")}))`;
  const equality = `(= ${left} ${right})`;
  return axiom(
    "Typing",
    [TYPED_SYMBOLS.indexOf(`T${name}`)],
    forall(variables, isGuarded ? `(=> (> y 0) ${equality})` : equality, [[left]], "Int"),
    `Typing T${name}`,
  );
};

export const TYPINGS: Record<string, () => Axiom> = {
  IntPlus: () => getTyping("IntPlus", "+", 2),
  IntMinus: () => getTyping("IntMinus", "-", 2),
  IntTimes: () => getTyping("IntTimes", "*", 2),
  IntUminus: () => getTyping("IntUminus", "-", 1),
  IntQuotient: () => getTyping("IntQuotient", "div", 2, true),
  IntRemainder: () => getTyping("IntRemainder", "mod", 2, true),
  IntLteq: () => getTyping("IntLteq", "<=", 2),
};

export const getEnumeration = (count: number) => {
  const symbol = tla(`SetEnum_${count}`);
  const elements = getNames("a", count);
  const set = call(symbol, elements);
  const elim = axiom(
    "EnumDefElim",
    [count],
    forall(
      [...elements, "x"],
      count === 0
        ? `(not (${MEM} x ${set}))`
        : `(=> (${MEM} x ${set}) ${disjoin(elements.map((element) => `(= x ${element})`))})`,
      [[`(${MEM} x ${set})`]],
    ),
  );
  if (count === 0) return [elim];
  const intro = axiom(
    "EnumDefIntro",
    [count],
    forall(elements, conjoin(elements.map((element) => `(${MEM} ${element} ${set})`)), [[set]]),
  );
  return [intro, elim];
};

export const getIntegers = (count: number) =>
  Array.from({ length: count }, (_value, index) => `(${CAST_INT} ${index + 1})`);

// TupExcept and RecExcept: updating one component of a tuple or record.
export const getComponentExcept = (
  name: string,
  args: AxiomArgument[],
  symbol: string,
  keys: string[],
  index: number,
) => {
  const elements = getNames("x", keys.length);
  const updated = `(${FUN_EXCEPT} ${call(symbol, elements)} ${keys[index]} x)`;
  const replaced = elements.map((element, position) => (position === index ? "x" : element));
  return axiom(
    name,
    [...args, index + 1],
    forall([...elements, "x"], `(= ${updated} ${call(symbol, replaced)})`, [[updated]]),
  );
};

export const getTupleAxioms = (count: number, isExcept: boolean) => {
  const symbol = tla(`Tuple_${count}`);
  const elements = getNames("x", count);
  const value = call(symbol, elements);
  const keys = getIntegers(count);
  return [
    axiom("TupIsafcn", [count], forall(elements, `(${FUN_ISAFCN} ${value})`, [[value]])),
    ...(count === 0
      ? []
      : [
          axiom(
            "TupDomDef",
            [count],
            forall(elements, `(= (${FUN_DOM} ${value}) ${call(tla(`SetEnum_${count}`), keys)})`, [
              [value],
            ]),
          ),
          axiom(
            "TupAppDef",
            [count],
            forall(
              elements,
              conjoin(
                keys.map((key, index) => `(= (${FUN_APP} ${value} ${key}) ${elements[index]})`),
              ),
              [[value]],
            ),
          ),
        ]),
    axiom(
      "SeqTupTyping",
      [count],
      forall(
        ["a", ...elements],
        count === 0
          ? `(${MEM} ${value} (${SEQ} a))`
          : `(=> ${conjoin(elements.map((element) => `(${MEM} ${element} a)`))} (${MEM} ${value} (${SEQ} a)))`,
        [[...elements.map((element) => `(${MEM} ${element} a)`), value]],
      ),
    ),
    axiom(
      "SeqTupLen",
      [count],
      forall(elements, `(= (${LEN} ${value}) (${CAST_INT} ${count}))`, [[value]]),
    ),
    ...(isExcept
      ? keys.map((_key, index) => getComponentExcept("TupExcept", [count], symbol, keys, index))
      : []),
  ];
};

export const getRecordAxioms = (fields: string[], isExcept: boolean) => {
  const symbol = tla(`Record_${fields.join("_")}`);
  const keys = fields.map((field) => tla(`StrLit_${field}`));
  const elements = getNames("x", fields.length);
  const value = call(symbol, elements);
  return [
    axiom("RecIsafcn", [fields], forall(elements, `(${FUN_ISAFCN} ${value})`, [[value]])),
    axiom(
      "RecDomDef",
      [fields],
      forall(elements, `(= (${FUN_DOM} ${value}) ${call(tla(`SetEnum_${fields.length}`), keys)})`, [
        [value],
      ]),
    ),
    axiom(
      "RecAppDef",
      [fields],
      forall(
        elements,
        conjoin(keys.map((key, index) => `(= (${FUN_APP} ${value} ${key}) ${elements[index]})`)),
        [[value]],
      ),
    ),
    ...(isExcept
      ? keys.map((_key, index) => getComponentExcept("RecExcept", [fields], symbol, keys, index))
      : []),
  ];
};

// The set of tuples or records whose components are in the given sets.
export const getComponentSet = (
  name: string,
  args: AxiomArgument[],
  set: string,
  value: string,
  keys: string[],
  variable: string,
) => {
  const sets = getNames("s", keys.length);
  const elements = getNames("x", keys.length);
  const members = call(set, sets);
  const built = call(value, elements);
  const projections = keys.map((key) => `(${FUN_APP} ${variable} ${key})`);
  return [
    axiom(
      `${name}Intro`,
      args,
      forall(
        [...sets, ...elements],
        `(=> ${conjoin(elements.map((element, index) => `(${MEM} ${element} ${sets[index]})`))} (${MEM} ${built} ${members}))`,
        [[built, members]],
      ),
    ),
    axiom(
      `${name}Elim`,
      args,
      forall(
        [...sets, variable],
        `(=> (${MEM} ${variable} ${members}) ${conjoin([`(= ${variable} ${call(value, projections)})`, ...projections.map((projection, index) => `(${MEM} ${projection} ${sets[index]})`)])})`,
        [[`(${MEM} ${variable} ${members})`]],
      ),
    ),
  ];
};
