/*---
description: Ported from TypeScript's tests/cases/conformance/es6/computedProperties/computedPropertyNamesSourceMap1_ES5.ts.
outcome: success
source: tests/cases/conformance/es6/computedProperties/computedPropertyNamesSourceMap1_ES5.ts
---*/
// @target: es5, es2015
// @sourceMap: true
class C {
    ["hello"]() {
        debugger;
    }
    get ["goodbye"]() {
		return 0;
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
