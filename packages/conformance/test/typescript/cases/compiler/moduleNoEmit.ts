/*---
description: Ported from TypeScript's tests/cases/compiler/moduleNoEmit.ts.
outcome: success
source: tests/cases/compiler/moduleNoEmit.ts
---*/
// @target: es2015
namespace Foo {
	1+1;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
