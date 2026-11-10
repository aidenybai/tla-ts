/*---
description: Ported from TypeScript's tests/cases/compiler/enumsWithMultipleDeclarations3.ts.
outcome: success
source: tests/cases/compiler/enumsWithMultipleDeclarations3.ts
---*/
// @target: es2015
namespace E {
}

enum E {
  A
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
