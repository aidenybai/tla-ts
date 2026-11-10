/*---
description: Ported from TypeScript's tests/cases/conformance/es6/arrowFunction/emitArrowFunctionWhenUsingArguments10_ES6.ts.
outcome: success
source: tests/cases/conformance/es6/arrowFunction/emitArrowFunctionWhenUsingArguments10_ES6.ts
---*/
﻿// @strict: false
// @target: es6

function f() {
    var _arguments = 10;
    var a = () => () => arguments;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
