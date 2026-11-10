/*---
description: Ported from TypeScript's tests/cases/compiler/arrayConstructors1.ts.
outcome: success
source: tests/cases/compiler/arrayConstructors1.ts
---*/
// @target: es2015
var x: string[];
x = new Array(1);
x = new Array('hi', 'bye'); 
x = new Array<string>('hi', 'bye');

var y: number[];
y = new Array(1);
y = new Array(1,2);
y = new Array<number>(1, 2);

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
