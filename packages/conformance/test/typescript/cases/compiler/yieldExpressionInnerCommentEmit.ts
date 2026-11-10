/*---
description: Ported from TypeScript's tests/cases/compiler/yieldExpressionInnerCommentEmit.ts.
outcome: success
source: tests/cases/compiler/yieldExpressionInnerCommentEmit.ts
---*/
// @target: es6
function * foo2() {
    /*comment1*/ yield 1;
    yield /*comment2*/ 2;
    yield 3 /*comment3*/
    yield */*comment4*/ [4];
    yield /*comment5*/* [5];
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
