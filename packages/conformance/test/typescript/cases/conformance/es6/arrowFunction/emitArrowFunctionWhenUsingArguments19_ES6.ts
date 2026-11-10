/*---
description: Ported from TypeScript's tests/cases/conformance/es6/arrowFunction/emitArrowFunctionWhenUsingArguments19_ES6.ts.
outcome: success
source: tests/cases/conformance/es6/arrowFunction/emitArrowFunctionWhenUsingArguments19_ES6.ts
---*/
﻿// @strict: false
// @target: es6

function f() {
    function g() {
        var _arguments = 10;                // No capture in 'g', so no conflict.
        function h() {
            var capture = () => arguments;  // Should trigger an '_arguments' capture into function 'h'
            foo(_arguments);                // Error as this does not resolve to the user defined '_arguments'
        }
    }

    function foo(x: any) {
        return 100;
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
