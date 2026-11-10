/*---
description: Ported from TypeScript's tests/cases/conformance/types/literal/stringLiteralsAssertionsInEqualityComparisons01.ts.
outcome: success
source: tests/cases/conformance/types/literal/stringLiteralsAssertionsInEqualityComparisons01.ts
---*/
﻿// @target: es2015
var a = "foo" === "bar" as string;
var b = "foo" !== ("bar" as string);
var c = "foo" == (<any>"bar");

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
