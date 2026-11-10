/*---
description: Ported from TypeScript's tests/cases/conformance/es2025/syncIteratorHelpers.ts.
outcome: success
source: tests/cases/conformance/es2025/syncIteratorHelpers.ts
---*/
// @target: esnext
// @lib: es2024,es2025.iterator
// @noemit: true
// @strict: true

[1, 2, 3, 4].values()
    .filter((x) => x % 2 === 0)
    .map((x) => x * 10)
    .toArray();

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
