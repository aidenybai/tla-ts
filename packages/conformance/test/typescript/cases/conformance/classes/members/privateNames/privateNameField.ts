/*---
description: Ported from TypeScript's tests/cases/conformance/classes/members/privateNames/privateNameField.ts.
outcome: success
source: tests/cases/conformance/classes/members/privateNames/privateNameField.ts
---*/
// @strict: true
// @target: es6

class A {
    #name: string;
    constructor(name: string) {
        this.#name = name;
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
