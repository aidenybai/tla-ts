import { MODULES, writeTest } from "./generate-common";

// A fixed seed keeps the generated tests stable across runs of the generator.
const SEED = 262;
const TEST_COUNT = 10_000;
const MAXIMUM_DEPTH = 4;
const TESTS_PER_DIRECTORY = 500;
// One expression in this many deliberately mixes types, to reach error paths inside nesting.
const MISTYPED_RATE = 12;

type ExpressionType = "int" | "bool" | "set" | "seq" | "record" | "function";

const createRandom = (seed: number) => {
  const state = { value: seed };
  // mulberry32, so that every platform draws the same sequence.
  const getNext = () => {
    state.value = (state.value + 0x6d2b79f5) | 0;
    const mixed = Math.imul(state.value ^ (state.value >>> 15), 1 | state.value);
    const result = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
  return getNext;
};

const TYPES: ExpressionType[] = ["int", "bool", "set", "seq", "record", "function"];

const createGenerator = (getNext: () => number) => {
  const pick = <Item>(items: Item[]) => items[Math.floor(getNext() * items.length)];
  const counter = { binder: 0 };

  const getBinder = () => {
    counter.binder += 1;
    return `b${counter.binder}`;
  };

  // Sets stay small here, since SUBSET and function sets multiply their sizes.
  const getSmallSet = () =>
    pick([
      "{}",
      "{1}",
      "{1, 2}",
      "{2, 1, 3}",
      "1..2",
      "2..1",
      "{0} \\cup {1}",
      "{1, 2} \\cap {2}",
      "{1, 2} \\ {1}",
    ]);

  const getExpression = (type: ExpressionType, depth: number, scope: string[]): string => {
    const actual = getNext() * MISTYPED_RATE < 1 ? pick(TYPES) : type;
    if (depth <= 0) return getLeaf(actual, scope);
    const child = (childType: ExpressionType, extra: string[] = []) =>
      getExpression(childType, depth - 1, [...scope, ...extra]);
    const productions: Record<ExpressionType, (() => string)[]> = {
      int: [
        () => `(${child("int")} + ${child("int")})`,
        () => `(${child("int")} - ${child("int")})`,
        () => `(${child("int")} * ${child("int")})`,
        () => `(${child("int")} \\div ${child("int")})`,
        () => `(${child("int")} % ${child("int")})`,
        () => `(-${child("int")})`,
        () => `Len(${child("seq")})`,
        () => `Cardinality(${child("set")})`,
        () => `Head(${child("seq")})`,
        () => `(${child("record")}).a`,
        () => `(${child("function")})[${child("int")}]`,
        () => `IF ${child("bool")} THEN ${child("int")} ELSE ${child("int")}`,
        () => `CASE ${child("bool")} -> ${child("int")} [] OTHER -> ${child("int")}`,
        () => {
          const binder = getBinder();
          return `LET ${binder} == ${child("int")} IN ${child("int", [binder])}`;
        },
        () => {
          const binder = getBinder();
          return `(CHOOSE ${binder} \\in ${child("set")} : ${child("bool", [binder])})`;
        },
      ],
      bool: [
        () => `(${child("bool")} /\\ ${child("bool")})`,
        () => `(${child("bool")} \\/ ${child("bool")})`,
        () => `(~${child("bool")})`,
        () => `(${child("bool")} => ${child("bool")})`,
        () => `(${child("bool")} <=> ${child("bool")})`,
        () => `(${child("int")} < ${child("int")})`,
        () => `(${child("int")} = ${child("int")})`,
        () => `(${child("set")} = ${child("set")})`,
        () => `(${child("seq")} = ${child("function")})`,
        () => `(${child("record")} = ${child("record")})`,
        () => `(${child("int")} \\in ${child("set")})`,
        () => `(${child("set")} \\subseteq ${child("set")})`,
        () => {
          const binder = getBinder();
          return `(\\A ${binder} \\in ${child("set")} : ${child("bool", [binder])})`;
        },
        () => {
          const binder = getBinder();
          return `(\\E ${binder} \\in ${child("set")} : ${child("bool", [binder])})`;
        },
      ],
      set: [
        () => `(${child("set")} \\cup ${child("set")})`,
        () => `(${child("set")} \\cap ${child("set")})`,
        () => `(${child("set")} \\ ${child("set")})`,
        () => `{${child("int")}, ${child("int")}}`,
        () => `(${child("int")} .. ${child("int")})`,
        () => `DOMAIN ${child("function")}`,
        () => `UNION {${child("set")}, ${child("set")}}`,
        () => {
          const binder = getBinder();
          return `{${binder} \\in ${child("set")} : ${child("bool", [binder])}}`;
        },
        () => {
          const binder = getBinder();
          return `{${child("int", [binder])} : ${binder} \\in ${child("set")}}`;
        },
      ],
      seq: [
        () => `<<${child("int")}, ${child("int")}>>`,
        () => `Tail(${child("seq")})`,
        () => `Append(${child("seq")}, ${child("int")})`,
        () => `(${child("seq")} \\o ${child("seq")})`,
        () => `SubSeq(${child("seq")}, ${child("int")}, ${child("int")})`,
        () => `SelectSeq(${child("seq")}, LAMBDA e : e > 0)`,
        () => `SortSeq(${child("seq")}, LAMBDA p, q : p < q)`,
        () => `[${child("seq")} EXCEPT ![1] = ${child("int")}]`,
      ],
      record: [
        () => `[a |-> ${child("int")}, b |-> ${child("bool")}]`,
        () => `[${child("record")} EXCEPT !.a = ${child("int")}]`,
        () => `[${child("record")} EXCEPT !.a = @ + ${child("int")}]`,
        () => `(CHOOSE r \\in [a : ${getSmallSet()}] : TRUE)`,
      ],
      function: [
        () => {
          const binder = getBinder();
          return `[${binder} \\in ${child("set")} |-> ${child("int", [binder])}]`;
        },
        () => `(${child("int")} :> ${child("int")})`,
        () => `(${child("function")} @@ ${child("function")})`,
        () => `[${child("function")} EXCEPT ![${child("int")}] = ${child("int")}]`,
        () => `(CHOOSE f \\in [${getSmallSet()} -> ${getSmallSet()}] : TRUE)`,
      ],
    };
    return pick(productions[actual])();
  };

  const getLeaf = (type: ExpressionType, scope: string[]) => {
    if (scope.length > 0 && type === "int" && getNext() < 0.5) return pick(scope);
    const leaves: Record<ExpressionType, string[]> = {
      int: ["0", "1", "2", "3", "-1", "7", "2147483647"],
      bool: ["TRUE", "FALSE"],
      set: [
        "{}",
        "{1}",
        "{1, 2}",
        "{2, 1, 3}",
        "1..3",
        "2..1",
        "Nat",
        "{x \\in 1..3 : x > 1}",
        "SUBSET {1}",
      ],
      seq: ["<<>>", "<<1>>", "<<1, 2>>", "<<3, 1, 2>>"],
      record: ["[a |-> 1]", "[a |-> 1, b |-> TRUE]"],
      function: ["[x \\in 1..2 |-> x]", "(1 :> 2)", "<<5, 6>>", "[x \\in Nat |-> x + 1]"],
    };
    return pick(leaves[type]);
  };

  return { getExpression, pick };
};

export const generateRandomExpressions = () => {
  const generator = createGenerator(createRandom(SEED));
  Array.from({ length: TEST_COUNT }).forEach((_, index) => {
    const type = generator.pick(TYPES);
    const shard = String(Math.floor(index / TESTS_PER_DIRECTORY)).padStart(3, "0");
    writeTest(
      `random/${shard}`,
      {
        description: `Evaluates a random ${type} expression, seed ${SEED}, number ${index}.`,
        ref: "tlc2/tool/impl/Tool.java#evalImpl",
        features: ["random-expression"],
        flags: ["expression"],
        contexts: ["assume"],
        outcome: "any",
      },
      `random_${String(index).padStart(5, "0")}`,
      `EXTENDS ${MODULES}\nTest == PrintT(${generator.getExpression(type, MAXIMUM_DEPTH, [])})`,
    );
  });
};
