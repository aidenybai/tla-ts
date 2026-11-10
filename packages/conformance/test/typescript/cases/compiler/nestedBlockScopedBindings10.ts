/*---
description: Ported from TypeScript's tests/cases/compiler/nestedBlockScopedBindings10.ts.
outcome: success
source: tests/cases/compiler/nestedBlockScopedBindings10.ts
---*/
// @target: es2015
{
    let x;
    x = 1;
}

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
