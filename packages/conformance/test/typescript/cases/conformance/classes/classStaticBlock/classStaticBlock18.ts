/*---
description: Ported from TypeScript's tests/cases/conformance/classes/classStaticBlock/classStaticBlock18.ts.
outcome: success
source: tests/cases/conformance/classes/classStaticBlock/classStaticBlock18.ts
---*/
// @target: esnext, es2022, es2015, es5

function foo () {
  return class {
    static foo = 1;
    static {
      const c = class {
        static bar = 2;
        static {
          // do
        }
      }
    }
  }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
