/*---
description: Ported from TypeScript's tests/cases/conformance/es2025/float16Array.ts.
outcome: success
source: tests/cases/conformance/es2025/float16Array.ts
---*/
// @target: esnext
// @lib: es2024,es2025.float16
// @noemit: true
// @strict: true

const float16 = new Float16Array(4);

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
