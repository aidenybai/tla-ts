/*---
description: Ported from TypeScript's tests/cases/compiler/templateLiteralsSourceMap.ts.
outcome: success
source: tests/cases/compiler/templateLiteralsSourceMap.ts
---*/
// @target: es2015
// @sourcemap: true

const s = `a${0}b${1}c${2}`;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
