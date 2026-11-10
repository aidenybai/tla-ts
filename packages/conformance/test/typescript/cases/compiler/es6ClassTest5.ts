/*---
description: Ported from TypeScript's tests/cases/compiler/es6ClassTest5.ts.
outcome: success
source: tests/cases/compiler/es6ClassTest5.ts
---*/
// @target: es2015
// @strict: false
class C1T5 {
    foo: (i: number, s: string) => number = 
	   	(i) => {
	        return i;
	    }
}
namespace C2T5 {}

class  bigClass {
     public break = 1;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
