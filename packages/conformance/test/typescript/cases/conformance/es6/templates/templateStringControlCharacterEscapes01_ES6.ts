/*---
description: Ported from TypeScript's tests/cases/conformance/es6/templates/templateStringControlCharacterEscapes01_ES6.ts.
outcome: success
source: tests/cases/conformance/es6/templates/templateStringControlCharacterEscapes01_ES6.ts
---*/
﻿// @target: es6

var x = `\0\x00\u0000 0 00 0000`;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
