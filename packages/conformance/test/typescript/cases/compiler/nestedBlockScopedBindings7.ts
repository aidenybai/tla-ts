/*---
description: Ported from TypeScript's tests/cases/compiler/nestedBlockScopedBindings7.ts.
outcome: success
source: tests/cases/compiler/nestedBlockScopedBindings7.ts
---*/
// @target: es2015
for (let x; false;) {
    () => x;
}

for (let y; false;) {
    y = 1;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
