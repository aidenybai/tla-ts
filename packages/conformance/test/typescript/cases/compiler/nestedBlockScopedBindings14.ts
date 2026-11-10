/*---
description: Ported from TypeScript's tests/cases/compiler/nestedBlockScopedBindings14.ts.
outcome: success
source: tests/cases/compiler/nestedBlockScopedBindings14.ts
---*/
// @target: es2015
var x;
for (; false;) {
    let x;
    () => x;
}

var y;
for (; false;) {
    let y;
    y = 1;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
