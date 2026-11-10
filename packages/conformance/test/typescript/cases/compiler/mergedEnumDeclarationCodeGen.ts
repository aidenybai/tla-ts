/*---
description: Ported from TypeScript's tests/cases/compiler/mergedEnumDeclarationCodeGen.ts.
outcome: success
source: tests/cases/compiler/mergedEnumDeclarationCodeGen.ts
---*/
// @target: es2015
enum E {
    a,
    b = a
}
enum E {
    c = a
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
