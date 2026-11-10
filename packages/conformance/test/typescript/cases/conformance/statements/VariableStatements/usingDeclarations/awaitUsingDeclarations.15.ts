/*---
description: Ported from TypeScript's tests/cases/conformance/statements/VariableStatements/usingDeclarations/awaitUsingDeclarations.15.ts.
outcome: success
source: tests/cases/conformance/statements/VariableStatements/usingDeclarations/awaitUsingDeclarations.15.ts
---*/
// @strict: false
// @target: esnext
// @module: esnext
// @lib: esnext
// @noTypesAndSymbols: true
// @noUnusedLocals: true

async function f() {
    await using _ = { async [Symbol.asyncDispose]() {} };
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
