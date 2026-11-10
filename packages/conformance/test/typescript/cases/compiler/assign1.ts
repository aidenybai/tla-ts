/*---
description: Ported from TypeScript's tests/cases/compiler/assign1.ts.
outcome: success
source: tests/cases/compiler/assign1.ts
---*/
// @target: es2015
namespace M {
    interface I {
        salt:number;
        pepper:number;
    }

    var x:I={salt:2,pepper:0};
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
