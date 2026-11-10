/*---
description: Ported from TypeScript's tests/cases/compiler/genericArray1.ts.
outcome: success
source: tests/cases/compiler/genericArray1.ts
---*/
// @target: es2015
// @declaration: true
/*
var n: number[];

interface Array<T> {
map<U>(callbackfn: (value: T, index: number, array: T[]) => U, thisArg?: any): U[];
}

interface String{
	length: number;
}
*/

var lengths = ["a", "b", "c"].map(x => x.length);

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
