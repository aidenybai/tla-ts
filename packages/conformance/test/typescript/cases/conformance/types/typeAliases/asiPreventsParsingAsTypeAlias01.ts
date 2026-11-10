/*---
description: Ported from TypeScript's tests/cases/conformance/types/typeAliases/asiPreventsParsingAsTypeAlias01.ts.
outcome: success
source: tests/cases/conformance/types/typeAliases/asiPreventsParsingAsTypeAlias01.ts
---*/
// @target: es2015

var type;
var string;
var Foo;

type
Foo = string;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
