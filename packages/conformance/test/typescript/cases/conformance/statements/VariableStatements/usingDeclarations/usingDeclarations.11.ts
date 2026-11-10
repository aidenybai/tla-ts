/*---
description: Ported from TypeScript's tests/cases/conformance/statements/VariableStatements/usingDeclarations/usingDeclarations.11.ts.
outcome: success
source: tests/cases/conformance/statements/VariableStatements/usingDeclarations/usingDeclarations.11.ts
---*/
// @strict: false
// @target: es5, es2015
// @module: esnext
// @lib: esnext
// @noTypesAndSymbols: true

class A {}
class C1 extends A {
    constructor() {
        using x = null;
        super();
    }
}
class C2 extends A {
    constructor() {
        super();
        using x = null;
    }
}
class C3 extends A {
    y = 1;
    constructor() {
        using x = null;
        super();
    }
}
class C4 extends A {
    constructor(public y: number) {
        using x = null;
        super();
    }
}
class C5 extends A {
    z = 1;
    constructor(public y: number) {
        using x = null;
        super();
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
