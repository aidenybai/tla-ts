/*---
description: Ported from TypeScript's tests/cases/compiler/declarationEmitEnumReadonlyProperty.ts.
outcome: success
source: tests/cases/compiler/declarationEmitEnumReadonlyProperty.ts
---*/
// @target: es2015
// @declaration: true
enum E {
    A = 'a',
    B = 'b'
}

class C {
    readonly type = E.A;
}

let x: E.A = new C().type;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
