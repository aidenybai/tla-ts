/*---
description: Ported from TypeScript's tests/cases/compiler/nestedBlockScopedBindings12.ts.
outcome: success
source: tests/cases/compiler/nestedBlockScopedBindings12.ts
---*/
// @target: es2015
var x;
{
    let x;
    x = 1;
}

var y;
switch (1) {
    case 1:
        let y;
        y = 1;
        break;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
