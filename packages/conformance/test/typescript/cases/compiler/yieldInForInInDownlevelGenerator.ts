/*---
description: Ported from TypeScript's tests/cases/compiler/yieldInForInInDownlevelGenerator.ts.
outcome: success
source: tests/cases/compiler/yieldInForInInDownlevelGenerator.ts
---*/
// @target: es5, es2015
// @lib: esnext
// https://github.com/microsoft/TypeScript/issues/49808
function* gen() {
  var obj: any = { foo: 1, bar: 2 };
  for (var key in obj) {
      yield key;
      delete obj.bar;
  }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
