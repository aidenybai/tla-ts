/*---
description: Ported from TypeScript's tests/cases/compiler/breakTarget2.ts.
outcome: success
source: tests/cases/compiler/breakTarget2.ts
---*/
// @target: es2015
target:
while (true) {
  break target;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
