/*---
description: Ported from TypeScript's tests/cases/conformance/es6/templates/templateStringWithBackslashEscapes01.ts.
outcome: success
source: tests/cases/conformance/es6/templates/templateStringWithBackslashEscapes01.ts
---*/
﻿// @target: es2015


var a = `hello\world`;
var b = `hello\\world`;
var c = `hello\\\world`;
var d = `hello\\\\world`;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
