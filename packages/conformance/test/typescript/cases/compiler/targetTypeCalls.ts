/*---
description: Ported from TypeScript's tests/cases/compiler/targetTypeCalls.ts.
outcome: success
source: tests/cases/compiler/targetTypeCalls.ts
---*/
// @target: es2015
var fra1: (v:any)=>string = function() { return function (v:string) {return v;}; }() // should work
var fra2: (v:any)=>number = function() { return function () { return 0; } }() // should work

var fra3: (v:any)=>string = function() { return function() { return function(v) {return v;};}(); }() // should work
var fra4: (v:any)=>void = function() { return function() { return function(v) {return v;};}(); }() // should work

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
