/*---
description: Ported from TypeScript's tests/cases/conformance/expressions/superCalls/superCalls.ts.
outcome: success
source: tests/cases/conformance/expressions/superCalls/superCalls.ts
---*/
// @target: es2015
class Base {
    x = 43;
    constructor(n: string) {

    }
}

function v(): void { }

class Derived extends Base {
    //super call in class constructor of derived type
    constructor(public q: number) {
        super('');
        //type of super call expression is void
        var p = super('');
        var p = v();
    }
}

class OtherBase {

}

class OtherDerived extends OtherBase {
    constructor() {
        var p = '';
        super();
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
