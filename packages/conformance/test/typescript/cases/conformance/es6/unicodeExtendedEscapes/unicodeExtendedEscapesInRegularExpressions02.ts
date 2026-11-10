/*---
description: Ported from TypeScript's tests/cases/conformance/es6/unicodeExtendedEscapes/unicodeExtendedEscapesInRegularExpressions02.ts.
outcome: success
source: tests/cases/conformance/es6/unicodeExtendedEscapes/unicodeExtendedEscapesInRegularExpressions02.ts
---*/
﻿// @target: es5,es6

var x = /\u{00}/gu;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
