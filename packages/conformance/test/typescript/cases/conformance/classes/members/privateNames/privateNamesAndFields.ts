/*---
description: Ported from TypeScript's tests/cases/conformance/classes/members/privateNames/privateNamesAndFields.ts.
outcome: success
source: tests/cases/conformance/classes/members/privateNames/privateNamesAndFields.ts
---*/
// @strict: true
// @target: es6

class A {
    #foo: number;
    constructor () {
        this.#foo = 3;
    }
}

class B extends A {
    #foo: string;
    constructor () {
        super();
        this.#foo = "some string";
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
