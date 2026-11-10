/*---
description: Ported from TypeScript's tests/cases/conformance/classes/members/privateNames/typeFromPrivatePropertyAssignment.ts.
outcome: success
source: tests/cases/conformance/classes/members/privateNames/typeFromPrivatePropertyAssignment.ts
---*/
// @target: esnext

type Foo = { foo?: string };

class C {
    #a?: Foo;
    #b?: Foo;

    m() {
        const a = this.#a || {};
        this.#b = this.#b || {};
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
