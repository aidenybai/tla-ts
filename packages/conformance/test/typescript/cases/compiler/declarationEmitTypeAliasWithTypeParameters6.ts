/*---
description: Ported from TypeScript's tests/cases/compiler/declarationEmitTypeAliasWithTypeParameters6.ts.
outcome: success
source: tests/cases/compiler/declarationEmitTypeAliasWithTypeParameters6.ts
---*/
﻿// @target: es2015
// @declaration: true

type Foo<T, Y> = {
    foo<U, J>(): Foo<U, J>
};
type SubFoo<R, S> = Foo<S, R>;

function foo() {
    return {} as SubFoo<number, string>;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
