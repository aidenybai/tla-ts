/*---
description: Ported from TypeScript's tests/cases/compiler/superPropertyElementNoUnusedLexicalThisCapture.ts.
outcome: success
source: tests/cases/compiler/superPropertyElementNoUnusedLexicalThisCapture.ts
---*/
// @target: es2015
class A { x() {} }

class B extends A {
    constructor() {
        super();
    }
    foo() {
        return () => {
            super.x;
        }
    }
    bar() {
        return () => {
            super["x"];
        }
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
