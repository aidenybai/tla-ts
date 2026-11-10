/*---
description: Ported from TypeScript's tests/cases/compiler/defaultIndexProps1.ts.
outcome: success
source: tests/cases/compiler/defaultIndexProps1.ts
---*/
// @target: es2015
class Foo {
	public v = "Yo";
}

var f = new Foo();

var q = f["v"];

var o = {v:"Yo2"};

var q2 = o["v"];

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
