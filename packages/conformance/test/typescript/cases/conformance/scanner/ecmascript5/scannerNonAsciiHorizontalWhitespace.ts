/*---
description: Ported from TypeScript's tests/cases/conformance/scanner/ecmascript5/scannerNonAsciiHorizontalWhitespace.ts.
outcome: success
source: tests/cases/conformance/scanner/ecmascript5/scannerNonAsciiHorizontalWhitespace.ts
---*/
// @target: es2015
//// [scannerNonAsciiHorizontalWhitespace.ts]
"  function f() {}"

//// [scannerNonAsciiHorizontalWhitespace.js]
"  function f() {}"

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
