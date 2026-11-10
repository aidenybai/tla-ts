/*---
description: Ported from TypeScript's tests/cases/conformance/es6/templates/templateStringWhitespaceEscapes2_ES6.ts.
outcome: success
source: tests/cases/conformance/es6/templates/templateStringWhitespaceEscapes2_ES6.ts
---*/
﻿//@target: es6

// <TAB>, <VT>, <FF>, <SP>, <NBSP>, <BOM>
`\u0009\u000B\u000C\u0020\u00A0\uFEFF`;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
