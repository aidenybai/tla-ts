/*---
description: Ported from TypeScript's tests/cases/conformance/es6/unicodeExtendedEscapes/unicodeExtendedEscapesInStrings09.ts.
outcome: success
source: tests/cases/conformance/es6/unicodeExtendedEscapes/unicodeExtendedEscapesInStrings09.ts
---*/
﻿// @target: es5,es6

// ES6 Spec - 10.1.1 Static Semantics: UTF16Encoding (cp)
//  2. If cp ≤ 65535, return cp.
// (10000 == 65536)
var x = "\u{10000}";

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
