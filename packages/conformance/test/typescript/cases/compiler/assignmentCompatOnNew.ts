/*---
description: Ported from TypeScript's tests/cases/compiler/assignmentCompatOnNew.ts.
outcome: success
source: tests/cases/compiler/assignmentCompatOnNew.ts
---*/
// @target: es2015
class Foo{};

function bar(x: {new(): Foo;}){}

bar(Foo); // Error, but should be allowed

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
