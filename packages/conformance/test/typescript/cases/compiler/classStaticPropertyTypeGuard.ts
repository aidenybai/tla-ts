/*---
description: Ported from TypeScript's tests/cases/compiler/classStaticPropertyTypeGuard.ts.
outcome: success
source: tests/cases/compiler/classStaticPropertyTypeGuard.ts
---*/
// @strictNullChecks: true
// @target: ES5, ES2015

// Repro from #8923

class A {
    private static _a: string | undefined;

    public get a(): string {
        if (A._a) {
            return A._a; // is possibly null or undefined.
        }
        return A._a = 'helloworld';
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
