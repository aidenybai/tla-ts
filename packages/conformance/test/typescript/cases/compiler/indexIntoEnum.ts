/*---
description: Ported from TypeScript's tests/cases/compiler/indexIntoEnum.ts.
outcome: success
source: tests/cases/compiler/indexIntoEnum.ts
---*/
// @target: es2015
namespace M {

    enum E { }

    var x = E[0];
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
