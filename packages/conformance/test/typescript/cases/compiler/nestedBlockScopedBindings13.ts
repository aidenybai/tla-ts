/*---
description: Ported from TypeScript's tests/cases/compiler/nestedBlockScopedBindings13.ts.
outcome: success
source: tests/cases/compiler/nestedBlockScopedBindings13.ts
---*/
// @target: es2015
for (; false;) {
    let x;
    () => x;
}

for (; false;) {
    let y;
    y = 1;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
