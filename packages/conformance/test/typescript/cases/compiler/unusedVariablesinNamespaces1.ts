/*---
description: Ported from TypeScript's tests/cases/compiler/unusedVariablesinNamespaces1.ts.
outcome: success
source: tests/cases/compiler/unusedVariablesinNamespaces1.ts
---*/
// @target: es2015
//@noUnusedLocals:true
//@noUnusedParameters:true

namespace Validation {
    const lettersRegexp = /^[A-Za-z]+$/;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
