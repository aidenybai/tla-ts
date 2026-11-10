/*---
description: Ported from TypeScript's tests/cases/compiler/sourceMapValidationDestructuringVariableStatementArrayBindingPattern7.ts.
outcome: success
source: tests/cases/compiler/sourceMapValidationDestructuringVariableStatementArrayBindingPattern7.ts
---*/
﻿// @target: es2015
// @sourcemap: true

var [x = 20, j] = [1, 2];

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
