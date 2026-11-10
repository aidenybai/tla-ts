/*---
description: Ported from TypeScript's tests/cases/compiler/es6ClassSuperCodegenBug.ts.
outcome: success
source: tests/cases/compiler/es6ClassSuperCodegenBug.ts
---*/
// @target: es2015
// @allowUnreachableCode: true

class A {
	constructor(str1:string, str2:string) {}
}
class B extends A {
    constructor() {
	    if (true) {
	        super('a1', 'b1');
	    } else {
	        super('a2', 'b2');
	    }
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
