/*---
description: Ported from TypeScript's tests/cases/conformance/es6/newTarget/newTarget.es6.ts.
outcome: success
source: tests/cases/conformance/es6/newTarget/newTarget.es6.ts
---*/
// @target: es6
class A {
    constructor() {
        const a = new.target;
        const b = () => new.target;
    }
    static c = function () { return new.target; }
    d = function () { return new.target; }
}

class B extends A {
    constructor() {
        super();
        const e = new.target;
        const f = () => new.target;
    }
}

function f1() {
    const g = new.target;
    const h = () => new.target;
}

const f2 = function () {
    const i = new.target;
    const j = () => new.target;
}

const O = {
    k: function () { return new.target; }
};

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
