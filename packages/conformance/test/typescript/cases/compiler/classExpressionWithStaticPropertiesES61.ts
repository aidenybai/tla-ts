/*---
description: Ported from TypeScript's tests/cases/compiler/classExpressionWithStaticPropertiesES61.ts.
outcome: success
source: tests/cases/compiler/classExpressionWithStaticPropertiesES61.ts
---*/
//@target: es6
var v = class C { 
    static a = 1;
    static b = 2;
    static c = C.a + 3;
};

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
