/*---
description: Ported from TypeScript's tests/cases/compiler/commentsOnObjectLiteral4.ts.
outcome: success
source: tests/cases/compiler/commentsOnObjectLiteral4.ts
---*/
// @removeComments: false
// @target: ES5, ES2015

var v = {
 /**
  * @type {number}
  */
 get bar(): number {
  return 12;
 }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
