/*---
description: Ported from TypeScript's tests/cases/compiler/strictModeEnumMemberNameReserved.ts.
outcome: success
source: tests/cases/compiler/strictModeEnumMemberNameReserved.ts
---*/
// @target: es2015
"use strict";
enum E {
    static
}

const x1: E.static = E.static;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
