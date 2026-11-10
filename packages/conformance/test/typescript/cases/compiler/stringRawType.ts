/*---
description: Ported from TypeScript's tests/cases/compiler/stringRawType.ts.
outcome: success
source: tests/cases/compiler/stringRawType.ts
---*/
﻿// @target: es6

String.raw({ raw: ["foo", "bar", "baz"] }, 1, 2);

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
