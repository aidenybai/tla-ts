/*---
description: Ported from TypeScript's tests/cases/conformance/es6/unicodeExtendedEscapes/unicodeExtendedEscapesInRegularExpressions01.ts.
outcome: success
source: tests/cases/conformance/es6/unicodeExtendedEscapes/unicodeExtendedEscapesInRegularExpressions01.ts
---*/
﻿// @target: es5,es6

var x = /\u{0}/gu;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
