/*---
description: Ported from TypeScript's tests/cases/compiler/sourceMapValidationDestructuringVariableStatementObjectBindingPattern2.ts.
outcome: success
source: tests/cases/compiler/sourceMapValidationDestructuringVariableStatementObjectBindingPattern2.ts
---*/
﻿// @target: es2015
// @sourcemap: true

var {x} = { x: 20 };
var { a, b } = { a: 30, b: 40 };

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
