/*---
description: Ported from TypeScript's tests/cases/conformance/classes/members/privateNames/privateNameFieldParenthesisLeftAssignment.ts.
outcome: success
source: tests/cases/conformance/classes/members/privateNames/privateNameFieldParenthesisLeftAssignment.ts
---*/
// @target: es2015

class Foo {
    #p: number;

    constructor(value: number) {
        this.#p = value;
    }

    t1(p: number) {
        (this.#p as number) = p;
    }

    t2(p: number) {
        (((this.#p as number))) = p;
    }

    t3(p: number) {
        (this.#p) = p;
    }

    t4(p: number) {
        (((this.#p))) = p;
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
