/*---
description: Ported from TypeScript's tests/cases/compiler/arrayFlatMap.ts.
outcome: success
source: tests/cases/compiler/arrayFlatMap.ts
---*/
// @target: es2015
// @lib: es2019

const array: number[] = [];
const readonlyArray: ReadonlyArray<number> = [];
array.flatMap((): ReadonlyArray<number> => []); // ok
readonlyArray.flatMap((): ReadonlyArray<number> => []); // ok

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
