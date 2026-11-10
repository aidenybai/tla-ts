/*---
description: Ported from TypeScript's tests/cases/compiler/arrayFind.ts.
outcome: success
source: tests/cases/compiler/arrayFind.ts
---*/
// @target: es2015
// @lib: es2015

// test fix for #18112, type guard predicates should narrow returned element
function isNumber(x: any): x is number {
  return typeof x === "number";
}

const arrayOfStringsNumbersAndBooleans = ["string", false, 0, "strung", 1, true];
const foundNumber: number | undefined = arrayOfStringsNumbersAndBooleans.find(isNumber);

const readonlyArrayOfStringsNumbersAndBooleans = arrayOfStringsNumbersAndBooleans as ReadonlyArray<string | number | boolean>;
const readonlyFoundNumber: number | undefined = readonlyArrayOfStringsNumbersAndBooleans.find(isNumber);

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
