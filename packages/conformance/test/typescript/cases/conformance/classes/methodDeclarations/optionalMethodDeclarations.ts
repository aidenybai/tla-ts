/*---
description: Ported from TypeScript's tests/cases/conformance/classes/methodDeclarations/optionalMethodDeclarations.ts.
outcome: success
source: tests/cases/conformance/classes/methodDeclarations/optionalMethodDeclarations.ts
---*/
// @target: esnext,es2016
// @noTypesAndSymbols: true

// https://github.com/microsoft/TypeScript/issues/34952#issuecomment-552025027
class C {
    // ? should be removed in emit
    method?() {}
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
