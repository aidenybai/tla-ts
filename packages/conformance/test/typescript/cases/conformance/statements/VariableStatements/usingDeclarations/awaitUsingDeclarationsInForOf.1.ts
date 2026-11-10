/*---
description: Ported from TypeScript's tests/cases/conformance/statements/VariableStatements/usingDeclarations/awaitUsingDeclarationsInForOf.1.ts.
outcome: success
source: tests/cases/conformance/statements/VariableStatements/usingDeclarations/awaitUsingDeclarationsInForOf.1.ts
---*/
// @strict: false
// @target: esnext,es2022,es2017,es2015,es5
// @module: esnext
// @lib: esnext
// @noTypesAndSymbols: true

async function main() {
    for (await using d1 of [{ async [Symbol.asyncDispose]() {} }, { [Symbol.dispose]() {} }, null, undefined]) {
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
