/*---
description: Ported from TypeScript's tests/cases/compiler/recursiveBaseConstructorCreation1.ts.
outcome: success
source: tests/cases/compiler/recursiveBaseConstructorCreation1.ts
---*/
// @target: es2015
class C1 {
public func(param: C2): any { }
}
class C2 extends C1 { }
var x = new C2(); // Valid

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
