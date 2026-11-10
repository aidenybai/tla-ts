/*---
description: Ported from TypeScript's tests/cases/compiler/fileWithNextLine1.ts.
outcome: success
source: tests/cases/compiler/fileWithNextLine1.ts
---*/
﻿// @target: es2015
// Note: there is a nextline (0x85) in the string
// 0.  It should be counted as a space and should not cause an error.
var v = '';

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
