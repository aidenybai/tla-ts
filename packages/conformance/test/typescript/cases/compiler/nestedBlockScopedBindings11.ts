/*---
description: Ported from TypeScript's tests/cases/compiler/nestedBlockScopedBindings11.ts.
outcome: success
source: tests/cases/compiler/nestedBlockScopedBindings11.ts
---*/
// @target: es2015
var x;
{
    let x;
    () => x;
}

var y;
switch (1) {
    case 1:
        let y;
        () => y;
        break;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
