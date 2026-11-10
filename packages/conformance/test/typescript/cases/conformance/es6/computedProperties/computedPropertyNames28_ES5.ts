/*---
description: Ported from TypeScript's tests/cases/conformance/es6/computedProperties/computedPropertyNames28_ES5.ts.
outcome: success
source: tests/cases/conformance/es6/computedProperties/computedPropertyNames28_ES5.ts
---*/
// @target: es5, es2015
class Base {
}
class C extends Base {
    constructor() {
        super();
        var obj = {
            [(super(), "prop")]() { }
        };
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
