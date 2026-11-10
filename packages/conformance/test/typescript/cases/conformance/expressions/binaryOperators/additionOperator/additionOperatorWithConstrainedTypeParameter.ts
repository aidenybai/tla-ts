/*---
description: Ported from TypeScript's tests/cases/conformance/expressions/binaryOperators/additionOperator/additionOperatorWithConstrainedTypeParameter.ts.
outcome: success
source: tests/cases/conformance/expressions/binaryOperators/additionOperator/additionOperatorWithConstrainedTypeParameter.ts
---*/
// @target: es2015
// test for #17069
function sum<T extends Record<K, number>, K extends string>(n: number, v: T, k: K) {
    n = n + v[k];
    n += v[k]; // += should work the same way
}
function realSum<T extends Record<K, number>, K extends string>(n: number, vs: T[], k: K) {
    for (const v of vs) {
        n = n + v[k];
        n += v[k];
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
