/*---
description: Ported from TypeScript's tests/cases/compiler/breakInIterationOrSwitchStatement3.ts.
outcome: success
source: tests/cases/compiler/breakInIterationOrSwitchStatement3.ts
---*/
// @target: es2015
for (;;) {
  break;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
