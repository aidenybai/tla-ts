/*---
description: Ported from TypeScript's tests/cases/conformance/es6/unicodeExtendedEscapes/unicodeExtendedEscapesInRegularExpressions18.ts.
outcome: success
source: tests/cases/conformance/es6/unicodeExtendedEscapes/unicodeExtendedEscapesInRegularExpressions18.ts
---*/
﻿// @target: es5,es6

var x = /\u{65}\u{65}/gu;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
