/*---
description: Ported from TypeScript's tests/cases/compiler/truthinessCallExpressionCoercion3.ts.
outcome: success
source: tests/cases/compiler/truthinessCallExpressionCoercion3.ts
---*/
// @target: es2015
// @strictNullChecks: true
// @lib: esnext,dom

// from #41640, based on an example in ant-design
interface I {
    always(): void
}

function f(result: unknown) {
    if ((result as I).always) {
        return result
    }
}
function g(result: unknown) {
    if (((result as I)).always) {
        return result
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
