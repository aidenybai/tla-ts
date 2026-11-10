/*---
description: Ported from TypeScript's tests/cases/conformance/types/specifyingTypes/typeLiterals/arrayLiteral.ts.
outcome: success
source: tests/cases/conformance/types/specifyingTypes/typeLiterals/arrayLiteral.ts
---*/
// @target: es2015
// valid uses of array literals

var x = [];
var x = new Array(1);

var y = [1];
var y = [1, 2];
var y = new Array<number>();

var x2: number[] = [];
var x2: number[] = new Array(1);

var y2: number[] = [1];
var y2: number[] = [1, 2];
var y2: number[] = new Array<number>();

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
