/*---
description: Ported from TypeScript's tests/cases/conformance/es6/arrowFunction/emitArrowFunctionWhenUsingArguments18.ts.
outcome: success
source: tests/cases/conformance/es6/arrowFunction/emitArrowFunctionWhenUsingArguments18.ts
---*/
﻿// @strict: false
// @target: es5, es2015

function f() {
    var { arguments: args } = { arguments };
    if (Math.random()) {
        return () => arguments;
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
