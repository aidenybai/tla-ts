/*---
description: Ported from TypeScript's tests/cases/compiler/methodSignatureDeclarationEmit1.ts.
outcome: success
source: tests/cases/compiler/methodSignatureDeclarationEmit1.ts
---*/
// @target: es2015
// @declaration: true
class C {
  public foo(n: number): void;
  public foo(s: string): void;
  public foo(a: any): void {
  }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
