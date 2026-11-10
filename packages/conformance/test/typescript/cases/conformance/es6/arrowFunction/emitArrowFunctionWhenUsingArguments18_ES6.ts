/*---
description: Ported from TypeScript's tests/cases/conformance/es6/arrowFunction/emitArrowFunctionWhenUsingArguments18_ES6.ts.
outcome: success
source: tests/cases/conformance/es6/arrowFunction/emitArrowFunctionWhenUsingArguments18_ES6.ts
---*/
﻿// @strict: false
// @target: es6

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
