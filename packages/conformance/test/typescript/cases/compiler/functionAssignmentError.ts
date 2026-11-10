/*---
description: Ported from TypeScript's tests/cases/compiler/functionAssignmentError.ts.
outcome: success
source: tests/cases/compiler/functionAssignmentError.ts
---*/
// @target: es2015
// @strict: false
var func = function (){return "ONE";};
func = function (){return "ONE";};

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
