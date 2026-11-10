/*---
description: Ported from TypeScript's tests/cases/compiler/strictBooleanMemberAssignability.ts.
outcome: success
source: tests/cases/compiler/strictBooleanMemberAssignability.ts
---*/
// @target: es2015
// @strict: true
class Abc {
    def: boolean
    constructor() {
        this.def = true
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
