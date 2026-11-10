/*---
description: Ported from TypeScript's tests/cases/conformance/types/stringLiteral/stringLiteralTypesWithTemplateStrings01.ts.
outcome: success
source: tests/cases/conformance/types/stringLiteral/stringLiteralTypesWithTemplateStrings01.ts
---*/
﻿// @target: es2015
// @declaration: true

let ABC: "ABC" = `ABC`;
let DE_NEWLINE_F: "DE\nF" = `DE
F`;
let G_QUOTE_HI: 'G"HI';
let JK_BACKTICK_L: "JK`L" = `JK\`L`;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
