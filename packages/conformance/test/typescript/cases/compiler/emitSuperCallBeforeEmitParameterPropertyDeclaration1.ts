/*---
description: Ported from TypeScript's tests/cases/compiler/emitSuperCallBeforeEmitParameterPropertyDeclaration1.ts.
outcome: success
source: tests/cases/compiler/emitSuperCallBeforeEmitParameterPropertyDeclaration1.ts
---*/
﻿// @target: es2015
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
