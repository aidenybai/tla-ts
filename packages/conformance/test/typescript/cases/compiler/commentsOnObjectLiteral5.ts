/*---
description: Ported from TypeScript's tests/cases/compiler/commentsOnObjectLiteral5.ts.
outcome: success
source: tests/cases/compiler/commentsOnObjectLiteral5.ts
---*/
// @removeComments: false
// @target: ES5, ES2015

const a = {
    p0: 0, // Comment 0
    p1: 0, /* Comment 1
    A multiline comment. */
    p2: 0, // Comment 2
};

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
