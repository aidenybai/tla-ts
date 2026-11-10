/*---
description: Ported from TypeScript's tests/cases/conformance/es7/exponentiationOperator/emitExponentiationOperatorInTemplateString3.ts.
outcome: success
source: tests/cases/conformance/es7/exponentiationOperator/emitExponentiationOperatorInTemplateString3.ts
---*/
﻿// @target: es5, es2015

var t1 = 10;
var t2 = 10;
var s;

// With TemplateTail
`${t1 ** t2} world`;
`${t1 ** t2 ** t1} world`;
`${t1 + t2 ** t1} world`;
`${t1 ** t2 + t1} world`;
`${t1 + t2 ** t2 + t1 } world`;
`${typeof (t1 ** t2 ** t1) } world`;
`${1 + typeof (t1 ** t2 ** t1) } world`;

`${t1 ** t2}${t1 ** t2} world`;
`${t1 ** t2 ** t1}${t1 ** t2 ** t1} world`;
`${t1 + t2 ** t1}${t1 + t2 ** t1} world`;
`${t1 ** t2 + t1}${t1 ** t2 + t1} world`;
`${t1 + t2 ** t2 + t1}${t1 + t2 ** t2 + t1} world`;
`${typeof (t1 ** t2 ** t1) }${typeof (t1 ** t2 ** t1) } world`;

`${t1 ** t2} hello world ${t1 ** t2} !!`;
`${t1 ** t2 ** t1} hello world ${t1 ** t2 ** t1} !!`;
`${t1 + t2 ** t1} hello world ${t1 + t2 ** t1} !!`;
`${t1 ** t2 + t1} hello world ${t1 ** t2 + t1} !!`;
`${t1 + t2 ** t2 + t1} hello world ${t1 + t2 ** t2 + t1} !!`;
`${typeof (t1 ** t2 ** t1) } hello world ${typeof (t1 ** t2 ** t1)} !!`;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
