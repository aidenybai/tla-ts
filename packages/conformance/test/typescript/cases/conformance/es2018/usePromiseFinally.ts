/*---
description: Ported from TypeScript's tests/cases/conformance/es2018/usePromiseFinally.ts.
outcome: success
source: tests/cases/conformance/es2018/usePromiseFinally.ts
---*/
// @target: es5, es2015
// @lib: es6,es2018

let promise1 = new Promise(function(resolve, reject) {})
                .finally(function() {});

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
