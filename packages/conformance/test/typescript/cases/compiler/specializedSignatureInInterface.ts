/*---
description: Ported from TypeScript's tests/cases/compiler/specializedSignatureInInterface.ts.
outcome: success
source: tests/cases/compiler/specializedSignatureInInterface.ts
---*/
// @target: es2015
interface A {
  (key:string):void;
}

interface B extends A {
  (key:'foo'):string;
  (key:'bar'):string;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
