/*---
description: Ported from TypeScript's tests/cases/compiler/arrayConcat2.ts.
outcome: success
source: tests/cases/compiler/arrayConcat2.ts
---*/
// @target: es2015
var a: string[] = [];
a.concat("hello", 'world');

a.concat('Hello');

var b = new Array<string>();
b.concat('hello');

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
