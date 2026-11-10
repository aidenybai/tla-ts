/*---
description: Ported from TypeScript's tests/cases/conformance/es6/computedProperties/computedPropertyNames31_ES6.ts.
outcome: success
source: tests/cases/conformance/es6/computedProperties/computedPropertyNames31_ES6.ts
---*/
// @target: es6
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
