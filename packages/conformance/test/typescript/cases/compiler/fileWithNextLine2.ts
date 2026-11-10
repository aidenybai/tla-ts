/*---
description: Ported from TypeScript's tests/cases/compiler/fileWithNextLine2.ts.
outcome: success
source: tests/cases/compiler/fileWithNextLine2.ts
---*/
﻿// @target: es2015
// Note: there is a nextline (0x85) char between the = and the 0.
// it should be treated like a space
var v =0;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
