/*---
description: Ported from TypeScript's tests/cases/compiler/commentOnArrayElement15.ts.
outcome: success
source: tests/cases/compiler/commentOnArrayElement15.ts
---*/
﻿// @target: es2015
const array = [/* comment */ 1 /* comment */];

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
