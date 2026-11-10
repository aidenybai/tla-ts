/*---
description: Ported from TypeScript's tests/cases/conformance/es6/computedProperties/computedPropertyNames31_ES5.ts.
outcome: success
source: tests/cases/conformance/es6/computedProperties/computedPropertyNames31_ES5.ts
---*/
// @target: es5, es2015
class Base {
    bar() {
        return 0;
    }
}
class C extends Base {
    foo() {
        () => {
            var obj = {
                [super.bar()]() { } // needs capture
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
