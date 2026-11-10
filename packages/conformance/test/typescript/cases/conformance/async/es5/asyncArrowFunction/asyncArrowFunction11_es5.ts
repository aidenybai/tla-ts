/*---
description: Ported from TypeScript's tests/cases/conformance/async/es5/asyncArrowFunction/asyncArrowFunction11_es5.ts.
outcome: success
source: tests/cases/conformance/async/es5/asyncArrowFunction/asyncArrowFunction11_es5.ts
---*/
// @target: es5, es2015
// @lib: esnext, dom
// @downlevelIteration: true
// https://github.com/Microsoft/TypeScript/issues/24722
class A {
    b = async (...args: any[]) => {
        await Promise.resolve();
        const obj = { ["a"]: () => this }; // computed property name after `await` triggers case
    };
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
