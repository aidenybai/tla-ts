/*---
description: Ported from TypeScript's tests/cases/conformance/statements/VariableStatements/usingDeclarations/usingDeclarationsInForOf.1.ts.
outcome: success
source: tests/cases/conformance/statements/VariableStatements/usingDeclarations/usingDeclarationsInForOf.1.ts
---*/
// @strict: false
// @target: esnext,es2022,es2017,es2015,es5
// @module: esnext
// @lib: esnext
// @noTypesAndSymbols: true

for (using d1 of [{ [Symbol.dispose]() {} }, null, undefined]) {
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
