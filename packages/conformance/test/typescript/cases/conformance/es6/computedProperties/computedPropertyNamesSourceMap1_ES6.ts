/*---
description: Ported from TypeScript's tests/cases/conformance/es6/computedProperties/computedPropertyNamesSourceMap1_ES6.ts.
outcome: success
source: tests/cases/conformance/es6/computedProperties/computedPropertyNamesSourceMap1_ES6.ts
---*/
// @target: es6
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
