/*---
description: Ported from TypeScript's tests/cases/compiler/json.stringify.ts.
outcome: success
source: tests/cases/compiler/json.stringify.ts
---*/
// @target: es2015
// @strictNullChecks: true

var value = null;
JSON.stringify(value, undefined, 2);
JSON.stringify(value, null, 2);
JSON.stringify(value, ["a", 1], 2);
JSON.stringify(value, (k) => undefined, 2);
JSON.stringify(value, undefined, 2);

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
