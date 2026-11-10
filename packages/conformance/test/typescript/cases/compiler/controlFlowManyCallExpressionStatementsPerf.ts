/*---
description: Ported from TypeScript's tests/cases/compiler/controlFlowManyCallExpressionStatementsPerf.ts.
outcome: success
source: tests/cases/compiler/controlFlowManyCallExpressionStatementsPerf.ts
---*/
// @target: es2015
// @strict: true

function test(x: boolean): boolean { return x; }

let state = true;

if (state) {
  test(state as any && state);
  test(state as any && state);
  test(state as any && state);
  test(state as any && state);
  test(state as any && state);
  test(state as any && state);
  test(state as any && state);
  test(state as any && state);
  test(state as any && state);
  test(state as any && state);
  test(state as any && state);
  test(state as any && state);
  test(state as any && state);
  test(state as any && state);
  test(state as any && state);
  test(state as any && state);
  test(state as any && state);
  test(state as any && state);
  test(state as any && state);
  test(state as any && state);
  test(state as any && state);
  test(state as any && state);
  test(state as any && state);
  test(state as any && state);
  test(state as any && state);
  test(state as any && state);
  test(state as any && state);
  test(state as any && state);
  test(state as any && state);
  test(state as any && state);
  test(state as any && state);
  test(state as any && state);
  test(state as any && state);
  test(state as any && state);
  test(state as any && state);
  test(state as any && state);
  test(state as any && state);
  test(state as any && state);
  test(state as any && state);
  test(state as any && state);
  test(state as any && state);
  test(state as any && state);
  test(state as any && state);
  test(state as any && state);
  test(state as any && state);
  test(state as any && state);
  test(state as any && state);
  test(state as any && state);
  test(state as any && state);
  test(state as any && state);
  test(state as any && state);
  test(state as any && state);
  test(state as any && state);
  test(state as any && state);
  test(state as any && state);
  test(state as any && state);
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
