/*---
description: Ported from TypeScript's tests/cases/conformance/es6/computedProperties/computedPropertyNames33_ES5.ts.
outcome: success
source: tests/cases/conformance/es6/computedProperties/computedPropertyNames33_ES5.ts
---*/
// @target: es5, es2015
function foo<T>() { return '' }
class C<T> {
    bar() {
        var obj = {
            [foo<T>()]() { }
        };
        return 0;
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
