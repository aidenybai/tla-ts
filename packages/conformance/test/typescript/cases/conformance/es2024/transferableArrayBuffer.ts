/*---
description: Ported from TypeScript's tests/cases/conformance/es2024/transferableArrayBuffer.ts.
outcome: success
source: tests/cases/conformance/es2024/transferableArrayBuffer.ts
---*/
// @target: esnext
// @lib: es2023,es2024.arraybuffer
// @noemit: true
// @strict: true

const buffer = new ArrayBuffer(8);
const buffer2 = buffer.transfer();

buffer.detached;
buffer2.detached;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
