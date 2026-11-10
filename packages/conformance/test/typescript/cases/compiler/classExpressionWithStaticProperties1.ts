/*---
description: Ported from TypeScript's tests/cases/compiler/classExpressionWithStaticProperties1.ts.
outcome: success
source: tests/cases/compiler/classExpressionWithStaticProperties1.ts
---*/
// @target: es2015
var v = class C {
    static a = 1;
    static b = 2;
    static c = C.a + C.b;
};

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
