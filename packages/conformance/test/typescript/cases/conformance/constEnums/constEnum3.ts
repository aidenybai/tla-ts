/*---
description: Ported from TypeScript's tests/cases/conformance/constEnums/constEnum3.ts.
outcome: success
source: tests/cases/conformance/constEnums/constEnum3.ts
---*/
// @target: es2015
const enum TestType { foo, bar }
type TestTypeStr = keyof typeof TestType;

function f1(f: TestType) { }
function f2(f: TestTypeStr) { }

f1(TestType.foo)
f1(TestType.bar)
f2('foo')
f2('bar')

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
