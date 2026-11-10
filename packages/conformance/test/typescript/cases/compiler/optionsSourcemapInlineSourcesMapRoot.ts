/*---
description: Ported from TypeScript's tests/cases/compiler/optionsSourcemapInlineSourcesMapRoot.ts.
outcome: success
source: tests/cases/compiler/optionsSourcemapInlineSourcesMapRoot.ts
---*/
// @target: es2015
// @sourcemap: true
// @inlineSources: true
// @mapRoot: local

var a = 10;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
