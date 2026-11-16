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
import { axiom, TYPED_SYMBOLS, type AxiomArgument } from "./table";

export const TYPED_OPERATORS: Record<string, [string, number]> = {
  IntPlus: ["+", 2],
  IntMinus: ["-", 2],
  IntTimes: ["*", 2],
  IntUminus: ["-", 1],
  IntQuotient: ["div", 2],
  IntRemainder: ["mod", 2],
  IntLteq: ["<=", 2],
};

export const getTyping = (name: string) => {
  const operator = TYPED_OPERATORS[name][0];
  const isGuarded = operator === "div" || operator === "mod";
  const variables = TYPED_OPERATORS[name][1] === 1 ? ["x1"] : isGuarded ? ["x", "y"] : ["x1", "x2"];
  const left = call(
    tla(name),
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

// Standardize writes a typed number as a cast and an untyped one as an IntLit.
export const getNumeral = (value: number, isArithmetic: boolean) =>
  isArithmetic ? `(${CAST_INT} ${value})` : tla(`IntLit_${value}`);

export const getIntegers = (count: number, isArithmetic: boolean) =>
  Array.from({ length: count }, (_value, index) => getNumeral(index + 1, isArithmetic));

export const getFieldKeys = (fields: string[]) => fields.map((field) => tla(`StrLit_${field}`));

const getComponentExcepts = (
  prefix: string,
  args: AxiomArgument[],
  symbol: string,
  keys: string[],
) => {
  const elements = getNames("x", keys.length);
  return keys.map((key, index) => {
    const updated = `(${FUN_EXCEPT} ${call(symbol, elements)} ${key} x)`;
    const replaced = elements.map((element, position) => (position === index ? "x" : element));
    return axiom(
      `${prefix}Except`,
      [...args, index + 1],
      forall([...elements, "x"], `(= ${updated} ${call(symbol, replaced)})`, [[updated]]),
    );
  });
};

export const getTupleExcepts = (count: number, isArithmetic: boolean) =>
  getComponentExcepts("Tup", [count], tla(`Tuple_${count}`), getIntegers(count, isArithmetic));

export const getRecordExcepts = (fields: string[]) =>
  getComponentExcepts("Rec", [fields], tla(`Record_${fields.join("_")}`), getFieldKeys(fields));

const getComponentFunction = (
  prefix: string,
  args: AxiomArgument[],
  symbol: string,
  keys: string[],
) => {
  const elements = getNames("x", keys.length);
  const value = call(symbol, elements);
  const isafcn = axiom(
    `${prefix}Isafcn`,
    args,
    forall(elements, `(${FUN_ISAFCN} ${value})`, [[value]]),
  );
  if (keys.length === 0) return [isafcn];
  return [
    isafcn,
    axiom(
      `${prefix}DomDef`,
      args,
      forall(elements, `(= (${FUN_DOM} ${value}) ${call(tla(`SetEnum_${keys.length}`), keys)})`, [
        [value],
      ]),
    ),
    axiom(
      `${prefix}AppDef`,
      args,
      forall(
        elements,
        conjoin(keys.map((key, index) => `(= (${FUN_APP} ${value} ${key}) ${elements[index]})`)),
        [[value]],
      ),
    ),
  ];
};

export const getTupleAxioms = (count: number, isExcept: boolean, isArithmetic: boolean) => {
  const symbol = tla(`Tuple_${count}`);
  const elements = getNames("x", count);
  const value = call(symbol, elements);
  return [
    ...getComponentFunction("Tup", [count], symbol, getIntegers(count, isArithmetic)),
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
      forall(elements, `(= (${LEN} ${value}) ${getNumeral(count, isArithmetic)})`, [[value]]),
    ),
    ...(isExcept ? getTupleExcepts(count, isArithmetic) : []),
  ];
};

export const getRecordAxioms = (fields: string[], isExcept: boolean) => [
  ...getComponentFunction("Rec", [fields], tla(`Record_${fields.join("_")}`), getFieldKeys(fields)),
  ...(isExcept ? getRecordExcepts(fields) : []),
];

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
