/*---
description: Ported from TypeScript's tests/cases/compiler/definiteAssignmentOfDestructuredVariable.ts.
outcome: success
source: tests/cases/compiler/definiteAssignmentOfDestructuredVariable.ts
---*/
// @target: es2015
// @strictNullChecks: true
// https://github.com/Microsoft/TypeScript/issues/20994
interface Options {
    a?: number | object;
    b: () => void;
}

class C<T extends Options> {
    foo!: { [P in keyof T]: T[P] }

    method() {
        let { a, b } = this.foo;
        !(a && b);
        a;
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
