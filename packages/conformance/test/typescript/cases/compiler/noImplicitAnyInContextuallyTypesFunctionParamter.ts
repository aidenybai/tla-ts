/*---
description: Ported from TypeScript's tests/cases/compiler/noImplicitAnyInContextuallyTypesFunctionParamter.ts.
outcome: success
source: tests/cases/compiler/noImplicitAnyInContextuallyTypesFunctionParamter.ts
---*/
// @target: es2015
// @noimplicitany: true

var regexMatchList = ['', ''];
regexMatchList.forEach(match => ''.replace(match, ''));

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
