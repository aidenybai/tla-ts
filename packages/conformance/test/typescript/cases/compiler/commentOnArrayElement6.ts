/*---
description: Ported from TypeScript's tests/cases/compiler/commentOnArrayElement6.ts.
outcome: success
source: tests/cases/compiler/commentOnArrayElement6.ts
---*/
﻿// @target: es2015
const array = [1, /* comment */];

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
