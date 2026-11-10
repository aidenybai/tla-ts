/*---
description: Ported from TypeScript's tests/cases/compiler/declarationEmitClassMemberNameConflict2.ts.
outcome: success
source: tests/cases/compiler/declarationEmitClassMemberNameConflict2.ts
---*/
// @strict: false
// @target: es5, es2015
// @module: commonjs
// @declaration: true

const Bar = 'bar';

enum Hello {
    World
}

enum Hello1 {
    World1
}

class Foo {
    // Same names + string => OK
    Bar = Bar;

    // Same names + enum => OK
    Hello = Hello;

    // Different names + enum => OK
    Hello2 = Hello1;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
