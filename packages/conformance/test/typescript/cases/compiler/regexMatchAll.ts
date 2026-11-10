/*---
description: Ported from TypeScript's tests/cases/compiler/regexMatchAll.ts.
outcome: success
source: tests/cases/compiler/regexMatchAll.ts
---*/
// @target: es2020

const matches = /\w/g[Symbol.matchAll]("matchAll");
const array = [...matches];
const { index, input } = array[0];

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
