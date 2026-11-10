/*---
description: Ported from TypeScript's tests/cases/compiler/controlFlowOuterVariable.ts.
outcome: success
source: tests/cases/compiler/controlFlowOuterVariable.ts
---*/
// @target: es2015
// @strictNullChecks: true

// Repros from #10641

const CONFIG = {
    foo: '',
    setFoo: function(foo: string) {
        CONFIG.foo = foo;
    }
};

const helper = function<T>(t: T[]) {
    helper(t.slice(1));
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
