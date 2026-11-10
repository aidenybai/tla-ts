/*---
description: Ported from TypeScript's tests/cases/compiler/variableDeclarator1.ts.
outcome: success
source: tests/cases/compiler/variableDeclarator1.ts
---*/
// @target: es2015
var a = function () {
        var c = 1;
        return c;
    };

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
