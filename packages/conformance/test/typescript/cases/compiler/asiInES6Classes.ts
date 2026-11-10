/*---
description: Ported from TypeScript's tests/cases/compiler/asiInES6Classes.ts.
outcome: success
source: tests/cases/compiler/asiInES6Classes.ts
---*/
// @target: es2015
class Foo {

 

    defaults = {

        done: false

    }

 

    bar() {

        return 3;

    }

 

}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
