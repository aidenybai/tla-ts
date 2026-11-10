/*---
description: Ported from TypeScript's tests/cases/compiler/reboundBaseClassSymbol.ts.
outcome: success
source: tests/cases/compiler/reboundBaseClassSymbol.ts
---*/
// @target: es2015
interface A { a: number; }
namespace Foo {
    var A = 1;
    interface B extends A { b: string; } 
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
