/*---
description: Ported from TypeScript's tests/cases/conformance/es6/unicodeExtendedEscapes/unicodeExtendedEscapesInRegularExpressions13.ts.
outcome: success
source: tests/cases/conformance/es6/unicodeExtendedEscapes/unicodeExtendedEscapesInRegularExpressions13.ts
---*/
﻿// @target: es5,es6

var x = /\u{DDDDD}/gu;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
