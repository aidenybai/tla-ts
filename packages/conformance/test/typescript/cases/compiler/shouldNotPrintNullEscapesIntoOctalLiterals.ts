/*---
description: Ported from TypeScript's tests/cases/compiler/shouldNotPrintNullEscapesIntoOctalLiterals.ts.
outcome: success
source: tests/cases/compiler/shouldNotPrintNullEscapesIntoOctalLiterals.ts
---*/
// @target: es2015
"use strict";
`\x001`;
`\u00001`;
`\u{00000000}1`;
`\u{000000}1`;
`\u{0}1`;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
