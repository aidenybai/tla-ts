/*---
description: Ported from TypeScript's tests/cases/compiler/regexMatchAll-esnext.ts.
outcome: success
source: tests/cases/compiler/regexMatchAll-esnext.ts
---*/
// @target: esnext

const matches = /\w/g[Symbol.matchAll]("matchAll");
const array = [...matches];
const { index, input } = array[0];

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
