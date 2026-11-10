/*---
description: Ported from TypeScript's tests/cases/compiler/sourceMap-SkippedNode.ts.
outcome: success
source: tests/cases/compiler/sourceMap-SkippedNode.ts
---*/
// @target: es2015
//@sourceMap: true
try {
// ...
} finally {
// N.B. No 'catch' block
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
