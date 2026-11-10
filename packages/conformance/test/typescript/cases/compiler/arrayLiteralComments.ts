/*---
description: Ported from TypeScript's tests/cases/compiler/arrayLiteralComments.ts.
outcome: success
source: tests/cases/compiler/arrayLiteralComments.ts
---*/
// @target: es2015
var testArrayWithFunc = [
    // Function comment
    function() {
        let x = 1;
    },
    // String comment
    '1',
    // Numeric comment
    2,
    // Object comment
    { a: 1 },
    // Array comment
    [1, 2, 3]
]

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
