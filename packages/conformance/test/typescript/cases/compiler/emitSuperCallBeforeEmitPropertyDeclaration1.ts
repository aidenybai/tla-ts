/*---
description: Ported from TypeScript's tests/cases/compiler/emitSuperCallBeforeEmitPropertyDeclaration1.ts.
outcome: success
source: tests/cases/compiler/emitSuperCallBeforeEmitPropertyDeclaration1.ts
---*/
﻿// @target: es2015
class A {
    blub = 6;
}


class B extends A {

    blub = 12;

    constructor() {
        "use strict";
        'someStringForEgngInject';
        super()
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
