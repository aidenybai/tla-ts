/*---
description: Ported from TypeScript's tests/cases/compiler/getAndSetNotIdenticalType.ts.
outcome: success
source: tests/cases/compiler/getAndSetNotIdenticalType.ts
---*/
// @target: es2015
class C {
    get x(): number {
        return 1;
    }
    set x(v: string) { }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
