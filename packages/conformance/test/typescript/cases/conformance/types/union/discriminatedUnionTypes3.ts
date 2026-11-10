/*---
description: Ported from TypeScript's tests/cases/conformance/types/union/discriminatedUnionTypes3.ts.
outcome: success
source: tests/cases/conformance/types/union/discriminatedUnionTypes3.ts
---*/
// @target: es2015
// @strict: true

// Repro from #44435

type Correct = {
	code: string
	property: true
	err: undefined
}
type Err = {
	err: `${string} is wrong!`
}
type SomeReturnType = Correct | Err;

const example: SomeReturnType = {} as SomeReturnType;

if (example.err === undefined) {
	example.property;  // true
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
