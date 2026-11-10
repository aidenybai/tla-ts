/*---
description: Ported from TypeScript's tests/cases/compiler/arrowFunctionWithObjectLiteralBody6.ts.
outcome: success
source: tests/cases/compiler/arrowFunctionWithObjectLiteralBody6.ts
---*/
// @target: es6
var a = () => <Error>{ name: "foo", message: "bar" };      

var b = () => (<Error>{ name: "foo", message: "bar" });    

var c = () => ({ name: "foo", message: "bar" });           

var d = () => ((<Error>({ name: "foo", message: "bar" })));

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
