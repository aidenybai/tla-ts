/*---
description: Ported from TypeScript's tests/cases/conformance/classes/members/instanceAndStaticMembers/typeOfThisInStaticMembers2.ts.
outcome: success
source: tests/cases/conformance/classes/members/instanceAndStaticMembers/typeOfThisInStaticMembers2.ts
---*/
// @target: es2015
class C {
    static foo = this; // ok
}

class C2<T> {
    static foo = this; // ok
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
