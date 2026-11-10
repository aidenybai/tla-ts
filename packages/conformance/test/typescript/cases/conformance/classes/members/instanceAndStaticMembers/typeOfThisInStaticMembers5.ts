/*---
description: Ported from TypeScript's tests/cases/conformance/classes/members/instanceAndStaticMembers/typeOfThisInStaticMembers5.ts.
outcome: success
source: tests/cases/conformance/classes/members/instanceAndStaticMembers/typeOfThisInStaticMembers5.ts
---*/
// @target: esnext, es2022, es6, es5

class C {
    static create = () => new this("yep")

    constructor (private foo: string) {

    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
