/*---
description: Ported from TypeScript's tests/cases/compiler/staticMemberWithStringAndNumberNames.ts.
outcome: success
source: tests/cases/compiler/staticMemberWithStringAndNumberNames.ts
---*/
// @target: es2015
class C {
    static "foo" = 0;
    static 0 = 1;

    x = C['foo'];
    x2 = C['0'];
    x3 = C[0];
        
    static s = C['foo'];
    static s2 = C['0'];
    static s3 = C[0];
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
