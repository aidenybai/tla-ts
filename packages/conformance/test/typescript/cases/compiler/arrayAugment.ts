/*---
description: Ported from TypeScript's tests/cases/compiler/arrayAugment.ts.
outcome: throws
source: tests/cases/compiler/arrayAugment.ts
---*/
// @target: es2015
interface Array<T> {
    split: (parts: number) => T[][];
}

var x = [''];
var y = x.split(4);
var y: string[][]; // Expect no error here

/*--- recorded
all:
  exit: 1
  transcript: throws
---*/
