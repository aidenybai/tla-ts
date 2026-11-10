/*---
description: Ported from TypeScript's tests/cases/compiler/getterErrorMessageNotDuplicated.ts.
outcome: success
source: tests/cases/compiler/getterErrorMessageNotDuplicated.ts
---*/
// @target: es2015
interface Thing {
    get style(): Foo;
    set style(cssText: string | Bar);
}

interface Foo {
    hello: string;
    world: number;
}

interface Bar extends Foo {
    extra: any;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
