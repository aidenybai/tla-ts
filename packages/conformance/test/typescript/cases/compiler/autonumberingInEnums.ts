/*---
description: Ported from TypeScript's tests/cases/compiler/autonumberingInEnums.ts.
outcome: success
source: tests/cases/compiler/autonumberingInEnums.ts
---*/
// @target: es2015
enum Foo {
    a = 1
}

enum Foo {
    b // should work fine
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
