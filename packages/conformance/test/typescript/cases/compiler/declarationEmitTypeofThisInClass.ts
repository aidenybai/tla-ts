/*---
description: Ported from TypeScript's tests/cases/compiler/declarationEmitTypeofThisInClass.ts.
outcome: success
source: tests/cases/compiler/declarationEmitTypeofThisInClass.ts
---*/
// @target: es2015
// @declaration: true
// @strict: true
class Foo {
    public foo!: string
    public bar!: typeof this.foo //Public property 'bar' of exported class has or is using private name 'this'.(4031)
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
