/*---
description: Ported from TypeScript's tests/cases/compiler/declarationEmitTypeAliasWithTypeParameters3.ts.
outcome: success
source: tests/cases/compiler/declarationEmitTypeAliasWithTypeParameters3.ts
---*/
﻿// @target: es2015
// @declaration: true

type Foo<T> = {
    foo<U>(): Foo<U>
};
function bar() {
    return {} as Foo<number>;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
