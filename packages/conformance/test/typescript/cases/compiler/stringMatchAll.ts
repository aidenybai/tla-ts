/*---
description: Ported from TypeScript's tests/cases/compiler/stringMatchAll.ts.
outcome: success
source: tests/cases/compiler/stringMatchAll.ts
---*/
// @target: es2020

const matches = "matchAll".matchAll(/\w/g);
const array = [...matches];
const { index, input } = array[0];

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
