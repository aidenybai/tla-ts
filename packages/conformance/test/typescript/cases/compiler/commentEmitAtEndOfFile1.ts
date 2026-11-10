/*---
description: Ported from TypeScript's tests/cases/compiler/commentEmitAtEndOfFile1.ts.
outcome: success
source: tests/cases/compiler/commentEmitAtEndOfFile1.ts
---*/
// @target: es2015
// @allowUnusedLabels: true

// test
var f = ''
// test #2
namespace foo {
        function bar() { }
}
// test #3
namespace empty {
}
// test #4

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
