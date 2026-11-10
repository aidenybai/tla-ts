/*---
description: Ported from TypeScript's tests/cases/compiler/selfInCallback.ts.
outcome: success
source: tests/cases/compiler/selfInCallback.ts
---*/
// @target: es2015
class C {
	public p1 = 0;
	public callback(cb:()=>void) {cb();}
	public doit() {
		this.callback(()=>{this.p1+1});
	}
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
