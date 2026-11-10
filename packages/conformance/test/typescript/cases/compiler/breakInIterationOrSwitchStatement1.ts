/*---
description: Ported from TypeScript's tests/cases/compiler/breakInIterationOrSwitchStatement1.ts.
outcome: success
source: tests/cases/compiler/breakInIterationOrSwitchStatement1.ts
---*/
// @target: es2015
while (true) {
  break;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
