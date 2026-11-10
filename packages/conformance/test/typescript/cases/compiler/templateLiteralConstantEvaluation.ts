/*---
description: Ported from TypeScript's tests/cases/compiler/templateLiteralConstantEvaluation.ts.
outcome: success
source: tests/cases/compiler/templateLiteralConstantEvaluation.ts
---*/
// @target: es2015
// @strict: true
// @noEmit: true

// https://github.com/microsoft/TypeScript/issues/58494

function fn<T>(arg: T): T {
    return arg;
}

const a = '1';
const b = a + ' 2';
const c = `${b} 3`;
const d = `${b} 3` as const;

fn(`${b} 3`);

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
