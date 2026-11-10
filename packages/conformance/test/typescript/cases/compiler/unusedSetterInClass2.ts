/*---
description: Ported from TypeScript's tests/cases/compiler/unusedSetterInClass2.ts.
outcome: success
source: tests/cases/compiler/unusedSetterInClass2.ts
---*/
// @target: es2015
// @noUnusedLocals:true

// Unlike everything else, a setter without a getter is used by a write access.
class Employee {
    private set p(_: number) {}

    m() {
        this.p = 0;
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
