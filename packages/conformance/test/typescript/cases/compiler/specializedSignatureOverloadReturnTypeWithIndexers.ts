/*---
description: Ported from TypeScript's tests/cases/compiler/specializedSignatureOverloadReturnTypeWithIndexers.ts.
outcome: success
source: tests/cases/compiler/specializedSignatureOverloadReturnTypeWithIndexers.ts
---*/
// @target: es2015
interface A {
    f(p: string): { [p: string]: string; };
    f(p: "spec"): { [p: string]: any; } // Should be ok
}
interface B {
    f(p: string): { [p: number]: string; };
    f(p: "spec"): { [p: string]: any; } // Should be ok
}
interface C {
    f(p: string): { [p: number]: string; };
    f(p: "spec"): { [p: number]: any; } // Should be ok
}
interface D {
    f(p: string): { [p: string]: string; };
    f(p: "spec"): { [p: number]: any; } // Should be error
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
