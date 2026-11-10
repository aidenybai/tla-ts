/*---
description: Ported from TypeScript's tests/cases/compiler/accessorWithLineTerminator.ts.
outcome: success
source: tests/cases/compiler/accessorWithLineTerminator.ts
---*/
// @target: es5, es2015

class C {
    get
    x() { return 1 }

    set
    x(v) {  }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
