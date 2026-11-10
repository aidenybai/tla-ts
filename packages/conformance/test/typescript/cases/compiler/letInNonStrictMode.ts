/*---
description: Ported from TypeScript's tests/cases/compiler/letInNonStrictMode.ts.
outcome: success
source: tests/cases/compiler/letInNonStrictMode.ts
---*/
// @target: es2015
let [x] = [1];
let {a: y} = {a: 1};

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
