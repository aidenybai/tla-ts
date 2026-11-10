/*---
description: Ported from TypeScript's tests/cases/compiler/declarationEmitPrivateReadonlyLiterals.ts.
outcome: success
source: tests/cases/compiler/declarationEmitPrivateReadonlyLiterals.ts
---*/
// @target: es2015
// @declaration: true

class Foo {
    private static readonly A = "a";
    private readonly B = "b";
    private static readonly C = 42;
    private readonly D = 42;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
