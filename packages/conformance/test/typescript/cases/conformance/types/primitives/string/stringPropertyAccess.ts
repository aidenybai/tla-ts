/*---
description: Ported from TypeScript's tests/cases/conformance/types/primitives/string/stringPropertyAccess.ts.
outcome: success
source: tests/cases/conformance/types/primitives/string/stringPropertyAccess.ts
---*/
// @target: es2015
var x = '';
var a = x.charAt(0);
var b = x.hasOwnProperty('charAt');

var c = x['charAt'](0);
var e = x['hasOwnProperty']('toFixed');

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
