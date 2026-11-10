/*---
description: Ported from TypeScript's tests/cases/compiler/subclassUint8Array.ts.
outcome: success
source: tests/cases/compiler/subclassUint8Array.ts
---*/
// @target: esnext
// @lib: esnext
// @noEmit: true
class CustomBuffer extends Uint8Array {
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
