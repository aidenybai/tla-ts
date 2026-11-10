/*---
description: Ported from TypeScript's tests/cases/compiler/assignmentNestedInLiterals.ts.
outcome: success
source: tests/cases/compiler/assignmentNestedInLiterals.ts
---*/
// @target: es2015
// @noImplicitAny: true
var target, x, y;
target = [x = 1, y = x];

var aegis, a, b;
aegis = { x: a = 1, y: b = a };

var kowloona, c, d;
for (kowloona of [c = 1, d = c]) {
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
