/*---
description: Ported from TypeScript's tests/cases/compiler/awaitExpressionInnerCommentEmit.ts.
outcome: success
source: tests/cases/compiler/awaitExpressionInnerCommentEmit.ts
---*/
// @target: esnext
async function foo() {
    /*comment1*/ await 1;
    await /*comment2*/ 2;
    await 3 /*comment3*/
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
