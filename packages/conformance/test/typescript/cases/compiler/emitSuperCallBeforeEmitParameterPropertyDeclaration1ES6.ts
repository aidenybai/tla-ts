/*---
description: Ported from TypeScript's tests/cases/compiler/emitSuperCallBeforeEmitParameterPropertyDeclaration1ES6.ts.
outcome: success
source: tests/cases/compiler/emitSuperCallBeforeEmitParameterPropertyDeclaration1ES6.ts
---*/
﻿// @target: ES6
class A {
    blub = 6;
}


class B extends A {
    constructor(public x: number) {
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
