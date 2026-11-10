/*---
description: Ported from TypeScript's tests/cases/compiler/circularObjectLiteralAccessors.ts.
outcome: success
source: tests/cases/compiler/circularObjectLiteralAccessors.ts
---*/
// @target: es5, es2015

// Repro from #6000

const a = {
    b: {
        get foo(): string {
            return a.foo;
        },
        set foo(value: string) {
            a.foo = value;
        }
    },
    foo: ''
};

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
