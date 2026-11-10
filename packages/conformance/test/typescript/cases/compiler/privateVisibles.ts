/*---
description: Ported from TypeScript's tests/cases/compiler/privateVisibles.ts.
outcome: success
source: tests/cases/compiler/privateVisibles.ts
---*/
// @target: es2015
class Foo {
	private pvar = 0;
	constructor() {
	    var n = this.pvar;
	}

	public meth() { var q = this.pvar;}
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
