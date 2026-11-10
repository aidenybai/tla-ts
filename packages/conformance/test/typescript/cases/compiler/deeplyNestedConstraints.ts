/*---
description: Ported from TypeScript's tests/cases/compiler/deeplyNestedConstraints.ts.
outcome: success
source: tests/cases/compiler/deeplyNestedConstraints.ts
---*/
// @target: es2015
// @strict: true
// @declaration: true

// Repro from #41931

type Enum = Record<string, string | number>;

type TypeMap<E extends Enum> = { [key in E[keyof E]]: number | boolean | string | number[] };

class BufferPool<E extends Enum, M extends TypeMap<E>> {
    setArray2<K extends E[keyof E]>(_: K, array: Extract<M[K], ArrayLike<any>>) {
        array.length; // Requires exploration of >5 levels of constraints
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
