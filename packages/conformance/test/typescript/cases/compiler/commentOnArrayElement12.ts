/*---
description: Ported from TypeScript's tests/cases/compiler/commentOnArrayElement12.ts.
outcome: success
source: tests/cases/compiler/commentOnArrayElement12.ts
---*/
﻿// @target: es2015
const array = [
    ,, /* comment */
];

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
