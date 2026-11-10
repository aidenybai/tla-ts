/*---
description: Ported from TypeScript's tests/cases/compiler/abstractIdentifierNameStrict.ts.
outcome: success
source: tests/cases/compiler/abstractIdentifierNameStrict.ts
---*/
// @target: es2015
var abstract = true;

function foo() {
    "use strict";
    var abstract = true;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
