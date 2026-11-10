/*---
description: Ported from TypeScript's tests/cases/compiler/commentOnBinaryOperator1.ts.
outcome: success
source: tests/cases/compiler/commentOnBinaryOperator1.ts
---*/
// @target: es2015
var a = 'some'
    // comment
    + 'text';

var b = 'some'
    /* comment */
    + 'text';

var c = 'some'
    /* comment */
    + /*comment1*/
    'text';

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
