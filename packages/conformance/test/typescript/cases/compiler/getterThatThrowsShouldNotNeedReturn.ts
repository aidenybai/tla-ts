/*---
description: Ported from TypeScript's tests/cases/compiler/getterThatThrowsShouldNotNeedReturn.ts.
outcome: success
source: tests/cases/compiler/getterThatThrowsShouldNotNeedReturn.ts
---*/
// @target: es2015
class Greeter {
 public get greet(): string {
  throw ''; // should not raise an error
 }
 public greeting(): string {
  throw ''; // should not raise an error
 }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
