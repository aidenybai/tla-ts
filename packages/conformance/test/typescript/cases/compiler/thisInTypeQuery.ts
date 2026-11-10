/*---
description: Ported from TypeScript's tests/cases/compiler/thisInTypeQuery.ts.
outcome: success
source: tests/cases/compiler/thisInTypeQuery.ts
---*/
// @target: es2015
// @strict: true
// @noEmit: true

// Repros from #52672

function assert(condition: unknown): asserts condition {
    if (!condition) {
        throw new Error();
    }
}

class MyClass {
    private map = {
        my_key: 'example_value'
    };

    runTypeFails() {
        const params = null as any as { a: { key: string } } | null;
        assert(params);
        type Key = keyof typeof this.map;
        this.map[params.a.key as Key];
    }
}

class C {
  foo() {
    const x = !!true;
    if (x) {
      type T0 = typeof this;
    }
  }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
