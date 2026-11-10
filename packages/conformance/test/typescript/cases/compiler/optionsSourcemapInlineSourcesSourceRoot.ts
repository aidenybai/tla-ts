/*---
description: Ported from TypeScript's tests/cases/compiler/optionsSourcemapInlineSourcesSourceRoot.ts.
outcome: success
source: tests/cases/compiler/optionsSourcemapInlineSourcesSourceRoot.ts
---*/
// @target: es2015
// @sourcemap: true
// @inlineSources: true
// @sourceRoot: local

var a = 10;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
