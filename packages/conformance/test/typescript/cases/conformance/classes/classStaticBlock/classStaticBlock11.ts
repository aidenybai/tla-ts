/*---
description: Ported from TypeScript's tests/cases/conformance/classes/classStaticBlock/classStaticBlock11.ts.
outcome: success
source: tests/cases/conformance/classes/classStaticBlock/classStaticBlock11.ts
---*/
// @target: esnext, es2022, es2015

let getX;
class C {
  #x = 1
  constructor(x: number) {
    this.#x = x;
  }

  static {
    // getX has privileged access to #x
    getX = (obj: C) => obj.#x;
  }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
