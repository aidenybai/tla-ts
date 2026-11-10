/*---
description: Ported from TypeScript's tests/cases/compiler/substitutionTypeForIndexedAccessType2.ts.
outcome: success
source: tests/cases/compiler/substitutionTypeForIndexedAccessType2.ts
---*/
// @target: es2015
interface Foo {
  foo: string|undefined
}

type Str<T extends string> = T

type Bar<T> = 
  T extends Foo
    ? T['foo'] extends string
      ? Str<T['foo']>
      : never
    : never

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
