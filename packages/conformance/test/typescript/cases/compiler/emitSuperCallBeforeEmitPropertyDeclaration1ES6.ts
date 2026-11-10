/*---
description: Ported from TypeScript's tests/cases/compiler/emitSuperCallBeforeEmitPropertyDeclaration1ES6.ts.
outcome: success
source: tests/cases/compiler/emitSuperCallBeforeEmitPropertyDeclaration1ES6.ts
---*/
﻿// @target: ES6
class A {
    blub = 6;
}


class B extends A {

    blub = 12;

    constructor() {
        'someStringForEgngInject';
        super()
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
