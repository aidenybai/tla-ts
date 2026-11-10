/*---
description: Ported from TypeScript's tests/cases/conformance/jsdoc/parseThrowsTag.ts.
outcome: success
source: tests/cases/conformance/jsdoc/parseThrowsTag.ts
---*/
// @target: es2015
/** @throws {Error} comment */
function f() {}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
