/*---
description: Ported from TypeScript's tests/cases/compiler/declarationEmitFBoundedTypeParams.ts.
outcome: success
source: tests/cases/compiler/declarationEmitFBoundedTypeParams.ts
---*/
// @target: es2015
// @declaration: true

// Repro from #6040

function append<a, b extends a>(result: a[], value: b): a[] {
    result.push(value);
    return result;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
