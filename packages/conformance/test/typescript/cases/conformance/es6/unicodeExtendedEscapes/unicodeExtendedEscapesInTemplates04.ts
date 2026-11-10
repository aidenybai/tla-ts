/*---
description: Ported from TypeScript's tests/cases/conformance/es6/unicodeExtendedEscapes/unicodeExtendedEscapesInTemplates04.ts.
outcome: success
source: tests/cases/conformance/es6/unicodeExtendedEscapes/unicodeExtendedEscapesInTemplates04.ts
---*/
﻿// @target: es5,es6

var x = `\u{00000000}`;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
