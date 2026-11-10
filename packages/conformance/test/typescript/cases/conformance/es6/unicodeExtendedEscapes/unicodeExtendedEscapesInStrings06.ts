/*---
description: Ported from TypeScript's tests/cases/conformance/es6/unicodeExtendedEscapes/unicodeExtendedEscapesInStrings06.ts.
outcome: success
source: tests/cases/conformance/es6/unicodeExtendedEscapes/unicodeExtendedEscapesInStrings06.ts
---*/
﻿// @target: es5,es6

// ES6 Spec - 10.1.1 Static Semantics: UTF16Encoding (cp)
//  1. Assert: 0 ≤ cp ≤ 0x10FFFF.
var x = "\u{10FFFF}";

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
