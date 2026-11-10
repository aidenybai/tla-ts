/*---
description: Ported from TypeScript's tests/cases/compiler/potentiallyUnassignedVariableInCatch.ts.
outcome: success
source: tests/cases/compiler/potentiallyUnassignedVariableInCatch.ts
---*/
// @target: es2015
// @strict: true

let foo;
try {
	if (Math.random() > 0.5) {
		foo = 1234;
	}
} catch {
	foo;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
