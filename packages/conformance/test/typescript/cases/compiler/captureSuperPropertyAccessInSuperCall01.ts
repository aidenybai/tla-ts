/*---
description: Ported from TypeScript's tests/cases/compiler/captureSuperPropertyAccessInSuperCall01.ts.
outcome: success
source: tests/cases/compiler/captureSuperPropertyAccessInSuperCall01.ts
---*/
// @target: es2015
class A {
	constructor(f: () => string) {
	}
	public blah(): string { return ""; }
}

class B extends A {
	constructor() {
		super(() => { return super.blah(); })
	}
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
