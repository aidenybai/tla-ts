/*---
description: Ported from TypeScript's tests/cases/compiler/commentOnArrayElement11.ts.
outcome: success
source: tests/cases/compiler/commentOnArrayElement11.ts
---*/
﻿// @target: es2015
const array = [
    , /* comment */
];

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
