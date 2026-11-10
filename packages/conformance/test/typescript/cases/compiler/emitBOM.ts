/*---
description: Ported from TypeScript's tests/cases/compiler/emitBOM.ts.
outcome: success
source: tests/cases/compiler/emitBOM.ts
---*/
﻿// @target: es2015
//@emitBOM: true
//@declaration: true
//@sourcemap: true

// JS and d.ts output should have a BOM but not the sourcemap
var x;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
