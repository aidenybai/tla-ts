/*---
description: Ported from TypeScript's tests/cases/compiler/castNewObjectBug.ts.
outcome: success
source: tests/cases/compiler/castNewObjectBug.ts
---*/
// @target: es2015
interface Foo { }
var xx = <Foo> new Object();

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
