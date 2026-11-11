import { MODULES, writeTest } from "./generate-common";

const SEED = 262;
const TEST_COUNT = 10_000;
const MAXIMUM_DEPTH = 4;
const TESTS_PER_DIRECTORY = 500;
const MISTYPED_RATE = 12;

type ExpressionType = "int" | "bool" | "set" | "seq" | "record" | "function";

const createRandom = (seed: number) => {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    const mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    const result = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
};

const TYPES: ExpressionType[] = ["int", "bool", "set", "seq", "record", "function"];

const createGenerator = (getNext: () => number) => {
  const pick = <Item>(items: Item[]) => items[Math.floor(getNext() * items.length)];
  let binderCount = 0;

  const getBinder = () => {
    binderCount += 1;
    return `b${binderCount}`;
  };

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
    const getChild = (childType: ExpressionType, extra: string[] = []) =>
      getExpression(childType, depth - 1, [...scope, ...extra]);
    const productions: Record<ExpressionType, (() => string)[]> = {
      int: [
        () => `(${getChild("int")} + ${getChild("int")})`,
        () => `(${getChild("int")} - ${getChild("int")})`,
        () => `(${getChild("int")} * ${getChild("int")})`,
        () => `(${getChild("int")} \\div ${getChild("int")})`,
        () => `(${getChild("int")} % ${getChild("int")})`,
        () => `(-${getChild("int")})`,
        () => `Len(${getChild("seq")})`,
        () => `Cardinality(${getChild("set")})`,
        () => `Head(${getChild("seq")})`,
        () => `(${getChild("record")}).a`,
        () => `(${getChild("function")})[${getChild("int")}]`,
        () => `IF ${getChild("bool")} THEN ${getChild("int")} ELSE ${getChild("int")}`,
        () => `CASE ${getChild("bool")} -> ${getChild("int")} [] OTHER -> ${getChild("int")}`,
        () => {
          const binder = getBinder();
          return `LET ${binder} == ${getChild("int")} IN ${getChild("int", [binder])}`;
        },
        () => {
          const binder = getBinder();
          return `(CHOOSE ${binder} \\in ${getChild("set")} : ${getChild("bool", [binder])})`;
        },
      ],
      bool: [
        () => `(${getChild("bool")} /\\ ${getChild("bool")})`,
        () => `(${getChild("bool")} \\/ ${getChild("bool")})`,
        () => `(~${getChild("bool")})`,
        () => `(${getChild("bool")} => ${getChild("bool")})`,
        () => `(${getChild("bool")} <=> ${getChild("bool")})`,
        () => `(${getChild("int")} < ${getChild("int")})`,
        () => `(${getChild("int")} = ${getChild("int")})`,
        () => `(${getChild("set")} = ${getChild("set")})`,
        () => `(${getChild("seq")} = ${getChild("function")})`,
        () => `(${getChild("record")} = ${getChild("record")})`,
        () => `(${getChild("int")} \\in ${getChild("set")})`,
        () => `(${getChild("set")} \\subseteq ${getChild("set")})`,
        () => {
          const binder = getBinder();
          return `(\\A ${binder} \\in ${getChild("set")} : ${getChild("bool", [binder])})`;
        },
        () => {
          const binder = getBinder();
          return `(\\E ${binder} \\in ${getChild("set")} : ${getChild("bool", [binder])})`;
        },
      ],
      set: [
        () => `(${getChild("set")} \\cup ${getChild("set")})`,
        () => `(${getChild("set")} \\cap ${getChild("set")})`,
        () => `(${getChild("set")} \\ ${getChild("set")})`,
        () => `{${getChild("int")}, ${getChild("int")}}`,
        () => `(${getChild("int")} .. ${getChild("int")})`,
        () => `DOMAIN ${getChild("function")}`,
        () => `UNION {${getChild("set")}, ${getChild("set")}}`,
        () => {
          const binder = getBinder();
          return `{${binder} \\in ${getChild("set")} : ${getChild("bool", [binder])}}`;
        },
        () => {
          const binder = getBinder();
          return `{${getChild("int", [binder])} : ${binder} \\in ${getChild("set")}}`;
        },
      ],
      seq: [
        () => `<<${getChild("int")}, ${getChild("int")}>>`,
        () => `Tail(${getChild("seq")})`,
        () => `Append(${getChild("seq")}, ${getChild("int")})`,
        () => `(${getChild("seq")} \\o ${getChild("seq")})`,
        () => `SubSeq(${getChild("seq")}, ${getChild("int")}, ${getChild("int")})`,
        () => `SelectSeq(${getChild("seq")}, LAMBDA e : e > 0)`,
        () => `SortSeq(${getChild("seq")}, LAMBDA p, q : p < q)`,
        () => `[${getChild("seq")} EXCEPT ![1] = ${getChild("int")}]`,
      ],
      record: [
        () => `[a |-> ${getChild("int")}, b |-> ${getChild("bool")}]`,
        () => `[${getChild("record")} EXCEPT !.a = ${getChild("int")}]`,
        () => `[${getChild("record")} EXCEPT !.a = @ + ${getChild("int")}]`,
        () => `(CHOOSE r \\in [a : ${getSmallSet()}] : TRUE)`,
      ],
      function: [
        () => {
          const binder = getBinder();
          return `[${binder} \\in ${getChild("set")} |-> ${getChild("int", [binder])}]`;
        },
        () => `(${getChild("int")} :> ${getChild("int")})`,
        () => `(${getChild("function")} @@ ${getChild("function")})`,
        () => `[${getChild("function")} EXCEPT ![${getChild("int")}] = ${getChild("int")}]`,
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

// Deviation from TLC: TLC runs out of memory, or past the JVM's array limit, on these.
const TLC_BUG_INDEXES = new Set([
  102, 1576, 2309, 2420, 3226, 3504, 3717, 4041, 5211, 5311, 6258, 6550, 7052, 8304,
]);

export const generateRandomExpressions = () => {
  const generator = createGenerator(createRandom(SEED));
  Array.from({ length: TEST_COUNT }).forEach((_value, index) => {
    const type = generator.pick(TYPES);
    const shard = String(Math.floor(index / TESTS_PER_DIRECTORY)).padStart(3, "0");
    writeTest(
      `random/${shard}`,
      {
        description: `Evaluates a random ${type} expression, seed ${SEED}, number ${index}.`,
        ref: "tlc2/tool/impl/Tool.java#evalImpl",
        features: TLC_BUG_INDEXES.has(index)
          ? ["random-expression", "tlc-bug"]
          : ["random-expression"],
        flags: ["expression"],
        contexts: ["assume"],
        outcome: "any",
      },
      `random_${String(index).padStart(5, "0")}`,
      `EXTENDS ${MODULES}\nTest == PrintT(${generator.getExpression(type, MAXIMUM_DEPTH, [])})`,
    );
  });
};
