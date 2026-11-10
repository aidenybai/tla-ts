/*---
description: Ported from TypeScript's tests/cases/conformance/jsdoc/jsdocTwoLineTypedef.ts.
outcome: success
source: tests/cases/conformance/jsdoc/jsdocTwoLineTypedef.ts
---*/
// @target: es2015
// Regression from #18301
/**
 * @typedef LoadCallback
 * @type {function}
 */
type LoadCallback = void;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
