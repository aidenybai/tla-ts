/*---
description: Ported from TypeScript's tests/cases/compiler/asyncImportNestedYield.ts.
outcome: success
source: tests/cases/compiler/asyncImportNestedYield.ts
---*/
// @module: commonjs
// @target: es2015
// @lib: esnext
async function* foo() {
    import((await import(yield "foo")).default);
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
