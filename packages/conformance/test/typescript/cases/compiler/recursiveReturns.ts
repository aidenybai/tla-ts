/*---
description: Ported from TypeScript's tests/cases/compiler/recursiveReturns.ts.
outcome: success
source: tests/cases/compiler/recursiveReturns.ts
---*/
// @target: es2015
function R1() {
	R1();
	return;
}

function R2() { R2(); }

function R3(n:number) {
	if (n == 0) {
		//return;
	}
	else {
		R3(n--);
	}
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
