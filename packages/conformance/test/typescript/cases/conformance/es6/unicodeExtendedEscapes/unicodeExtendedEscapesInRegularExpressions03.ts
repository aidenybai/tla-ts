/*---
description: Ported from TypeScript's tests/cases/conformance/es6/unicodeExtendedEscapes/unicodeExtendedEscapesInRegularExpressions03.ts.
outcome: success
source: tests/cases/conformance/es6/unicodeExtendedEscapes/unicodeExtendedEscapesInRegularExpressions03.ts
---*/
﻿// @target: es5,es6

var x = /\u{0000}/gu;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
