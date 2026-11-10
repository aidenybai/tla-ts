/*---
description: Ported from TypeScript's tests/cases/conformance/constEnums/constEnumPropertyAccess3.ts.
outcome: success
source: tests/cases/conformance/constEnums/constEnumPropertyAccess3.ts
---*/
// @target: es2015
const enum E {
    A = ~1,
    B = -1,
    C = ~(1 + 1),
    D = -(1 + 2),
    E = 1 - 10,
}

E.A.toString();
E.B.toString();
E.C.toString();
E.D.toString();

E["A"].toString();
E["B"].toString();
E["C"].toString();
E["D"].toString();
E["E"].toString();

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
