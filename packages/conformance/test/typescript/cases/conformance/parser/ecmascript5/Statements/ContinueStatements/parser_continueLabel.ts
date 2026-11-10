/*---
description: Ported from TypeScript's tests/cases/conformance/parser/ecmascript5/Statements/ContinueStatements/parser_continueLabel.ts.
outcome: success
source: tests/cases/conformance/parser/ecmascript5/Statements/ContinueStatements/parser_continueLabel.ts
---*/
// @target: es2015
label1: for(var i = 0; i < 1; i++) {
    continue label1;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
