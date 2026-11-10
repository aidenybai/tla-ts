/*---
description: Ported from TypeScript's tests/cases/compiler/breakTarget3.ts.
outcome: success
source: tests/cases/compiler/breakTarget3.ts
---*/
// @target: es2015
// @allowUnusedLabels: true

target1:
target2:
while (true) {
  break target1;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
