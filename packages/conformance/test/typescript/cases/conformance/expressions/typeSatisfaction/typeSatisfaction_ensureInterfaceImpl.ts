/*---
description: Ported from TypeScript's tests/cases/conformance/expressions/typeSatisfaction/typeSatisfaction_ensureInterfaceImpl.ts.
outcome: success
source: tests/cases/conformance/expressions/typeSatisfaction/typeSatisfaction_ensureInterfaceImpl.ts
---*/
// @target: es2015
type Movable = {
    move(distance: number): void;
};

const car = {
    start() { },
    move(d) {
        // d should be number
    },
    stop() { }
} satisfies Movable & Record<string, unknown>;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
