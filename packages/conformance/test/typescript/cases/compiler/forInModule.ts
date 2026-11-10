/*---
description: Ported from TypeScript's tests/cases/compiler/forInModule.ts.
outcome: success
source: tests/cases/compiler/forInModule.ts
---*/
// @target: es2015
// @strict: false
namespace Foo {
	for (var i = 0; i < 1; i++) {
		i+i;
	}
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
