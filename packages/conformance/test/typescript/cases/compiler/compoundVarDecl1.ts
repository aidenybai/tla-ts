/*---
description: Ported from TypeScript's tests/cases/compiler/compoundVarDecl1.ts.
outcome: success
source: tests/cases/compiler/compoundVarDecl1.ts
---*/
// @target: es2015
namespace Foo { var a = 1, b = 1; a = b + 2; }

var foo = 4, bar = 5;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
