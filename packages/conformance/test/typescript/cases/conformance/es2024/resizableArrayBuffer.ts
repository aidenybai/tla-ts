/*---
description: Ported from TypeScript's tests/cases/conformance/es2024/resizableArrayBuffer.ts.
outcome: success
source: tests/cases/conformance/es2024/resizableArrayBuffer.ts
---*/
// @target: esnext
// @lib: es2023,es2024.arraybuffer
// @noemit: true
// @strict: true

const buffer = new ArrayBuffer(8, { maxByteLength: 16 });
buffer.resizable;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
