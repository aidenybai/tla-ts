/*---
description: Ported from TypeScript's tests/cases/compiler/thisConditionalOnMethodReturnOfGenericInstance.ts.
outcome: success
source: tests/cases/compiler/thisConditionalOnMethodReturnOfGenericInstance.ts
---*/
// @target: es2015
// @strict: true
class A<T> {
    unmeasurableUsage!: {[K in keyof T]-?: T[K]};
}

class B<T> extends A<T> {
    method(): string | (this extends C ? undefined : null) {
        return "";
    }
}

class C<T = any> extends B<T> {
    marker!: string;
}

const x = new C<{}>();

const y = x.method(); // usage flags `method` in `B` as circular and marks `y` as the error-any type

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
