/*---
description: Ported from TypeScript's tests/cases/conformance/es6/computedProperties/computedPropertyNames29_ES5.ts.
outcome: success
source: tests/cases/conformance/es6/computedProperties/computedPropertyNames29_ES5.ts
---*/
// @target: es5, es2015
class C {
    bar() {
        () => {
            var obj = {
                [this.bar()]() { } // needs capture
            };
        }
        return 0;
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
