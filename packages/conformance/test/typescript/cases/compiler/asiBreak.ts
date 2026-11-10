/*---
description: Ported from TypeScript's tests/cases/compiler/asiBreak.ts.
outcome: success
source: tests/cases/compiler/asiBreak.ts
---*/
﻿// @target: es2015
while (true) break

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
