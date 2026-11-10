/*---
description: Ported from TypeScript's tests/cases/conformance/es6/templates/templateStringWhitespaceEscapes2.ts.
outcome: success
source: tests/cases/conformance/es6/templates/templateStringWhitespaceEscapes2.ts
---*/
﻿// @target: es2015


// <TAB>, <VT>, <FF>, <SP>, <NBSP>, <BOM>
`\u0009\u000B\u000C\u0020\u00A0\uFEFF`;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
