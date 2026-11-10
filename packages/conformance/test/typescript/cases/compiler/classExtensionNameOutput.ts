/*---
description: Ported from TypeScript's tests/cases/compiler/classExtensionNameOutput.ts.
outcome: success
source: tests/cases/compiler/classExtensionNameOutput.ts
---*/
// @target: es2015
class A {}
if (true) {
  class B extends A {}

  const foo = function () {
    new B();
  }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
