/*---
description: Ported from TypeScript's tests/cases/compiler/classOrderBug.ts.
outcome: success
source: tests/cases/compiler/classOrderBug.ts
---*/
// @target: es2015
class bar {
    public baz: foo;
    constructor() {

        this.baz = new foo();

    }

}

class baz {}
class foo extends baz {}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
