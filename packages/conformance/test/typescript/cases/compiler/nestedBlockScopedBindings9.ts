/*---
description: Ported from TypeScript's tests/cases/compiler/nestedBlockScopedBindings9.ts.
outcome: success
source: tests/cases/compiler/nestedBlockScopedBindings9.ts
---*/
// @target: es2015
{
    let x;
    () => x;
}

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
