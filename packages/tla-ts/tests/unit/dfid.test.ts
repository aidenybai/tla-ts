import { expect, it } from "vite-plus/test";
import { checkDepthFirst, type DepthFirstOutput } from "../../src/dfid";

const searchDepthFirst = (body: string, coverage?: number) => {
  const outputs: DepthFirstOutput[] = [];
  checkDepthFirst({
    source: `---- MODULE M ----\nEXTENDS Naturals\nVARIABLES x, y\n${body}\n====`,
    config: "INIT Init\nNEXT Next",
    maxDepth: 3,
    coverage,
    onOutput: (output) => outputs.push(output),
  });
  return outputs;
};

it("generates every successor of an action past an incomplete one, as TLC's Tool does", () => {
  const body =
    "Init == x = 0 /\\ y = 0\nA == x < 2 /\\ x' = x + 1 /\\ y' = y\nB == x' \\in {1, 2, 3} /\\ IF x' = 1 THEN TRUE ELSE y' = x'\nNext == A \\/ B";
  const messages = searchDepthFirst(body).flatMap((output) =>
    output.kind === "message" ? [output.message] : [],
  );
  expect(messages.at(-1)).toBe("5 states generated, 2 distinct states found.");
  const coverage = searchDepthFirst(body, 1).flatMap((output) =>
    output.kind === "coverage" ? output.coverage.relations : [],
  );
  expect(coverage.find((relation) => relation.label.startsWith("B "))).toMatchObject({
    distinct: 0,
    generated: 3,
    expressions: [
      { location: "line 6, col 6 to line 6, col 21 of module M", depth: 0, count: 3, cost: 0 },
      { location: "line 6, col 13 to line 6, col 21 of module M", depth: 1, count: 1, cost: 4 },
      { location: "line 6, col 29 to line 6, col 34 of module M", depth: 0, count: 3, cost: 0 },
      { location: "line 6, col 41 to line 6, col 44 of module M", depth: 0, count: 1, cost: 0 },
      { location: "line 6, col 51 to line 6, col 57 of module M", depth: 0, count: 2, cost: 0 },
    ],
  });
});
