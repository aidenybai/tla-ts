/*---
description: Ported from TypeScript's tests/cases/compiler/arrowFunctionWithObjectLiteralBody5.ts.
outcome: success
source: tests/cases/compiler/arrowFunctionWithObjectLiteralBody5.ts
---*/
// @target: es2015
var a = () => <Error>{ name: "foo", message: "bar" };      

var b = () => (<Error>{ name: "foo", message: "bar" });    

var c = () => ({ name: "foo", message: "bar" });           

var d = () => ((<Error>({ name: "foo", message: "bar" })));

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
