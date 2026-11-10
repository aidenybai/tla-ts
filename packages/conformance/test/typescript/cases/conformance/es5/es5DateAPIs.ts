/*---
description: Ported from TypeScript's tests/cases/conformance/es5/es5DateAPIs.ts.
outcome: success
source: tests/cases/conformance/es5/es5DateAPIs.ts
---*/
// @target: es5, es2015
// @lib: es5

Date.UTC(2017); // should error

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
