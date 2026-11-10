/*---
description: Ported from TypeScript's tests/cases/compiler/templateExpressionNoInlininingOfConstantBindingWithInitializer.ts.
outcome: success
source: tests/cases/compiler/templateExpressionNoInlininingOfConstantBindingWithInitializer.ts
---*/
// @target: es2015
type Params = {
  value?: string | number
}

function example(parameters: Params) {
  const { value = '123' } = parameters
  return `${value}` === '345'
}

function example2(parameters: Params) {
  const { value = '123' } = parameters
  const b = `${value}`;
  return b;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
