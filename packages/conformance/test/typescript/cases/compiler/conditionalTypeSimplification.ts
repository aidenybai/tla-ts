/*---
description: Ported from TypeScript's tests/cases/compiler/conditionalTypeSimplification.ts.
outcome: success
source: tests/cases/compiler/conditionalTypeSimplification.ts
---*/
// @target: es2015
// Repro from #30794

interface AbstractSchema<S, V> {
  m1<T> (v: T): SchemaType<S, Exclude<V, T>>;
  m2<T> (v: T): SchemaType<S, T>;
}

type SchemaType<S, V> = S extends object ? AnySchema<V> : never;
interface AnySchema<V> extends AnySchemaType<AnySchema<undefined>, V> { }
interface AnySchemaType<S extends AbstractSchema<any, any>, V> extends AbstractSchema<S, V> { }

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
