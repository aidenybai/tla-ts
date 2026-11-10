/*---
description: Ported from TypeScript's tests/cases/compiler/spreadExpressionContextualType.ts.
outcome: success
source: tests/cases/compiler/spreadExpressionContextualType.ts
---*/
// @target: es2015
// @strict: true
// @declaration: true

// Repro from #43966

interface Orange {
    name: string;
}

interface Apple {
    name: string;
}

function test<T extends Apple | Orange>(item: T): T {
    return { ...item };
}

function test2<T extends Apple | Orange>(item: T): T {
    const x = { ...item };
    return x;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
