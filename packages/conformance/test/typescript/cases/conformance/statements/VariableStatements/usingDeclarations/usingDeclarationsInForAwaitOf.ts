/*---
description: Ported from TypeScript's tests/cases/conformance/statements/VariableStatements/usingDeclarations/usingDeclarationsInForAwaitOf.ts.
outcome: success
source: tests/cases/conformance/statements/VariableStatements/usingDeclarations/usingDeclarationsInForAwaitOf.ts
---*/
// @strict: false
// @target: esnext,es2022,es2017,es2015,es5
// @module: esnext
// @lib: esnext
// @noTypesAndSymbols: true

async function main() {
    for await (using d1 of [{ [Symbol.dispose]() {} }, null, undefined]) {
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
