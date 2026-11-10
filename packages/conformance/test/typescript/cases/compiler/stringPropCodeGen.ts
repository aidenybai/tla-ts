/*---
description: Ported from TypeScript's tests/cases/compiler/stringPropCodeGen.ts.
outcome: success
source: tests/cases/compiler/stringPropCodeGen.ts
---*/
// @target: es2015
var a = {

  "foo" : function() { },
  "bar" : 5

};



a.foo();

a.bar.toString();

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
