/*---
description: Ported from TypeScript's tests/cases/compiler/superCallWithCommentEmit01.ts.
outcome: success
source: tests/cases/compiler/superCallWithCommentEmit01.ts
---*/
// @target: es2015
class A {
    constructor(public text: string) { }
}

class B extends A {
    constructor(text: string) {
        // this is subclass constructor
        super(text)
     }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
