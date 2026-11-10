/*---
description: Ported from TypeScript's tests/cases/compiler/commentOnStaticMember1.ts.
outcome: success
source: tests/cases/compiler/commentOnStaticMember1.ts
---*/
// @target: es2015
class Greeter {
    //Hello World
    static foo(){
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
