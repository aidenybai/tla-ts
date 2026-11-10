/*---
description: Ported from TypeScript's tests/cases/compiler/forOfTransformsExpression.ts.
outcome: success
source: tests/cases/compiler/forOfTransformsExpression.ts
---*/
// @target: es2015
// https://github.com/Microsoft/TypeScript/issues/11024
let items = [{ name: "A" }, { name: "C" }, { name: "B" }];
for (var item of items.sort((a, b) => a.name.localeCompare(b.name))) {

}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
