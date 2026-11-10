/*---
description: Ported from TypeScript's tests/cases/compiler/testContainerList.ts.
outcome: success
source: tests/cases/compiler/testContainerList.ts
---*/
// @target: es2015
// Regression test for #325
namespace A {
    class C {
        constructor(public d: {}) { }
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
