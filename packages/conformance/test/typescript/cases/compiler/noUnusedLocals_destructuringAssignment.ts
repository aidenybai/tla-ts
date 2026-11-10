/*---
description: Ported from TypeScript's tests/cases/compiler/noUnusedLocals_destructuringAssignment.ts.
outcome: success
source: tests/cases/compiler/noUnusedLocals_destructuringAssignment.ts
---*/
// @target: es2015
// @noUnusedLocals: true

class C {
    private x = 0;

    m(): number {
        let x: number;
        ({ x } = this);
        return x;
    }

    private f(): Function {
        let f: Function;
        ({ f } = this);
        return f;
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
