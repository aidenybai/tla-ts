/*---
description: Ported from TypeScript's tests/cases/compiler/optionsSourcemapInlineSources.ts.
outcome: success
source: tests/cases/compiler/optionsSourcemapInlineSources.ts
---*/
// @target: es2015
// @sourcemap: true
// @inlineSources: true

var a = 10;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
