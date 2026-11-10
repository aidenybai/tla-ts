/*---
description: Ported from TypeScript's tests/cases/compiler/thisInStaticMethod1.ts.
outcome: success
source: tests/cases/compiler/thisInStaticMethod1.ts
---*/
// @target: es2015
class foo {
 static x = 3;
 static bar() {
  return this.x;
 } 
} 
var x = foo.bar();

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
