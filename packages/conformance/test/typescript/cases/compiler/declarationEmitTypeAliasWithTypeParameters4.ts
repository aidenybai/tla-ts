/*---
description: Ported from TypeScript's tests/cases/compiler/declarationEmitTypeAliasWithTypeParameters4.ts.
outcome: success
source: tests/cases/compiler/declarationEmitTypeAliasWithTypeParameters4.ts
---*/
﻿// @target: es2015
// @declaration: true

type Foo<T, Y> = {
    foo<U, J>(): Foo<U, J>
};
type SubFoo<R> = Foo<string, R>;

function foo() {
    return {} as SubFoo<number>;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
