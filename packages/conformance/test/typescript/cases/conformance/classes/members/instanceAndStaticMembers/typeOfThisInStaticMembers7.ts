/*---
description: Ported from TypeScript's tests/cases/conformance/classes/members/instanceAndStaticMembers/typeOfThisInStaticMembers7.ts.
outcome: success
source: tests/cases/conformance/classes/members/instanceAndStaticMembers/typeOfThisInStaticMembers7.ts
---*/
// @target: esnext, es2022, es6, es5

class C {
    static a = 1;
    static b = this.a + 1;
}

class D extends C {
    static c = 2;
    static d = this.c + 1;
    static e = 1 + (super.a) + (this.c + 1) + 1;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
