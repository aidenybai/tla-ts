/*---
description: Ported from TypeScript's tests/cases/conformance/classes/members/privateNames/privateNameAndStaticInitializer.ts.
outcome: success
source: tests/cases/conformance/classes/members/privateNames/privateNameAndStaticInitializer.ts
---*/
// @target: esnext, es2022, es2015

class A {
  #foo = 1;
  static inst = new A();
  #prop = 2;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
