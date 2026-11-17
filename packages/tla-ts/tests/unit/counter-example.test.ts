import { describe, expect, it } from "vite-plus/test";
import { check } from "../../src";
import { checkFixture } from "./check-harness";

const checkCounterExample = async (configName: string) => {
  const printed: string[] = [];
  const result = await checkFixture("tlc-ext", "CounterExample", configName, {
    onPrint: (text) => printed.push(text),
  });
  return [result.status, ...printed, ...(result.violation?.postconditionOutput ?? [])];
};

describe("POSTCONDITION after a violation matches TLC", () => {
  it("binds CounterExample to the behavior that violates an invariant or deadlocks", async () => {
    expect(
      await Promise.all(
        ["CounterExampleInvariant", "CounterExampleDeadlock"].map(checkCounterExample),
      ),
    ).toEqual([
      [
        "invariant-violation",
        "<<[x |-> 0], [x |-> 1], [x |-> 2]>>",
        '{<<1, "Up", 2>>, <<2, "Up", 3>>}',
      ],
      ["deadlock", "<<[x |-> 0], [x |-> 1], [x |-> 2]>>", '{<<1, "Up", 2>>, <<2, "Up", 3>>}'],
    ]);
  });

  it("closes the lasso of a liveness violation with the step back to the loop", async () => {
    expect(
      await Promise.all(["CounterExampleCycle", "CounterExampleStutter"].map(checkCounterExample)),
    ).toEqual([
      [
        "liveness-violation",
        "<<[x |-> 0], [x |-> 1], [x |-> 2]>>",
        '{<<1, "Up", 2>>, <<2, "Up", 3>>, <<3, "Back", 2>>}',
      ],
      [
        "liveness-violation",
        "<<[x |-> 0], [x |-> 1], [x |-> 2]>>",
        '{<<1, "Up", 2>>, <<2, "Up", 3>>, <<3, "Up", 3>>}',
      ],
    ]);
  });

  it("keeps the status of the violation when the postcondition is false", async () => {
    expect((await checkCounterExample("CounterExampleFails"))[0]).toBe("invariant-violation");
  });
});

const checkAliased = async (body: string, config: string) => {
  const printed: string[] = [];
  const result = await check({
    source: `---- MODULE M ----\nEXTENDS Naturals, TLC, TLCExt\nVARIABLE x\nAlias == [a |-> x, n |-> x']\nPost == PrintT(CounterExample.state)\nInit == x = 0\n${body}\n====`,
    config: `INIT Init\nNEXT Next\n${config}\nALIAS Alias\nPOSTCONDITION Post`,
    onPrint: (text) => printed.push(text),
  });
  return [...printed, ...(result.violation?.postconditionOutput ?? [])];
};

describe("POSTCONDITION with an ALIAS matches TLC", () => {
  it("binds CounterExample to the alias of each state of a safety violation", async () => {
    expect(
      await Promise.all([
        checkAliased("Next == x' = x + 1\nInv == x < 2", "INVARIANT Inv"),
        checkAliased("Next == FALSE /\\ x' = x", ""),
      ]),
    ).toEqual([
      ["{ <<1, [a |-> 0, n |-> 1]>>,\n  <<2, [a |-> 1, n |-> 2]>>,\n  <<3, [a |-> 2, n |-> 2]>> }"],
      ["{<<1, [a |-> 0, n |-> 0]>>}"],
    ]);
  });

  it("binds CounterExample to the states of an initial state that violates an invariant", async () => {
    expect(await checkAliased("Next == x' = x + 1\nInv == x > 0", "INVARIANT Inv")).toEqual([
      "{<<1, [x |-> 0]>>}",
    ]);
  });
});

const checkFailedNext = async (next: string, config: string) => {
  const result = await check({
    source: `---- MODULE M ----\nEXTENDS Naturals, TLC, TLCExt\nVARIABLE x\nPost == PrintT(DOMAIN CounterExample)\nInit == x = 0\nNext == ${next}\n====`,
    config: `INIT Init\nNEXT Next\nPOSTCONDITION Post\n${config}`,
    onPrint: () => {},
  });
  return result.failure?.traceOutput ?? [];
};

describe("POSTCONDITION after a next-state failure matches TLC", () => {
  it("checks the postconditions only as TLC goes on to find the failed state deadlocked", async () => {
    const failing = "x' = x + 1 /\\ (x < 1 \\/ CHOOSE e \\in {} : TRUE)";
    expect(
      await Promise.all([
        checkFailedNext(failing, ""),
        checkFailedNext(failing, "CHECK_DEADLOCK FALSE"),
        checkFailedNext("x' = x + 1 \\/ (x = 1 /\\ CHOOSE e \\in {} : TRUE)", ""),
      ]),
    ).toEqual([['{"action", "state", "console"}'], [], []]);
  });
});

const checkUnassigned = async (init: string, printed: string) => {
  const result = await check({
    source: `---- MODULE M ----\nEXTENDS Naturals, TLC, TLCExt\nVARIABLES x, y\nInit == ${init}\nNext == x' = 1\nPost == PrintT(${printed}) /\\ FALSE\n====`,
    config: "INIT Init\nNEXT Next\nPOSTCONDITION Post",
    onPrint: () => {},
  });
  return [result.failure?.traceOutput, result.failure?.postcondition?.message];
};

describe("POSTCONDITION after a state that leaves a variable unassigned", () => {
  it("checks the postconditions after an illegal initial state, as TLC does", async () => {
    expect(await checkUnassigned("x = 0", 'TLCGet("stats").generated')).toEqual([
      ["1"],
      "Postcondition Post at line 6, col 9 to line 6, col 50 of module M is false.",
    ]);
  });

  it("binds CounterExample to an illegal initial state with null for the unassigned variable", async () => {
    expect(await checkUnassigned("x = 0", "CounterExample")).toEqual([
      ["[action |-> {}, state |-> {<<1, [x |-> 0, y |-> null]>>}]"],
      "Postcondition Post at line 6, col 9 to line 6, col 39 of module M is false.",
    ]);
  });

  it("binds CounterExample to an incomplete successor with null for the unassigned variable, where TLC fails before the postconditions", async () => {
    expect(await checkUnassigned("x = 0 /\\ y = 0", "CounterExample")).toEqual([
      [
        [
          "[ action |->",
          "      { << <<1, [x |-> 0, y |-> 0]>>,",
          '           [ name |-> "Next",',
          "             location |->",
          "                 [ beginLine |-> 5,",
          "                   beginColumn |-> 9,",
          "                   endLine |-> 5,",
          "                   endColumn |-> 14,",
          '                   module |-> "M" ] ],',
          "           <<2, [x |-> 1, y |-> null]>> >> },",
          "  state |-> {<<1, [x |-> 0, y |-> 0]>>, <<2, [x |-> 1, y |-> null]>>} ]",
        ].join("\n"),
      ],
      "Postcondition Post at line 6, col 9 to line 6, col 39 of module M is false.",
    ]);
  });
});
