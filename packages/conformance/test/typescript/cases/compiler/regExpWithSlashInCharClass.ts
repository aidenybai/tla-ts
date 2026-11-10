/*---
description: Ported from TypeScript's tests/cases/compiler/regExpWithSlashInCharClass.ts.
outcome: success
source: tests/cases/compiler/regExpWithSlashInCharClass.ts
---*/
// @target: es2015
var foo1 = "a/".replace(/.[/]/, "");
var foo2 = "a//".replace(/.[//]/g, "");
var foo3 = "a/".replace(/.[/no sleep /till/]/, "bugfix");

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
