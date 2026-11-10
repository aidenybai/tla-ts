/*---
description: Ported from TypeScript's tests/cases/compiler/sourceMapValidationDestructuringVariableStatementArrayBindingPattern4.ts.
outcome: success
source: tests/cases/compiler/sourceMapValidationDestructuringVariableStatementArrayBindingPattern4.ts
---*/
﻿// @target: es2015
// @sourcemap: true

var [x] = [1, 2];

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
