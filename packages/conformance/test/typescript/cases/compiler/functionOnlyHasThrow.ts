/*---
description: Ported from TypeScript's tests/cases/compiler/functionOnlyHasThrow.ts.
outcome: success
source: tests/cases/compiler/functionOnlyHasThrow.ts
---*/
// @target: es2015
function clone():number {
	throw new Error("To be implemented");
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
