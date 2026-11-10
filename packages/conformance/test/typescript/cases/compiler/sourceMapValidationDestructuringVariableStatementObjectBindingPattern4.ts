/*---
description: Ported from TypeScript's tests/cases/compiler/sourceMapValidationDestructuringVariableStatementObjectBindingPattern4.ts.
outcome: success
source: tests/cases/compiler/sourceMapValidationDestructuringVariableStatementObjectBindingPattern4.ts
---*/
﻿// @target: es2015
// @sourcemap: true

var {x = 500,
     y} = { x: 20, y: "hi" };

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
