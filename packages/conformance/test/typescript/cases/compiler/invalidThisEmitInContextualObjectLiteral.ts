/*---
description: Ported from TypeScript's tests/cases/compiler/invalidThisEmitInContextualObjectLiteral.ts.
outcome: success
source: tests/cases/compiler/invalidThisEmitInContextualObjectLiteral.ts
---*/
// @target: es2015
interface IDef {
	p1: (e:string) => void;
	p2: () => (n: number) => any;
}

class TestController {
	public m(def: IDef) { }
	public p = this.m({
		p1: e => { },
		p2: () => { return vvvvvvvvv => this; },
	});
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
