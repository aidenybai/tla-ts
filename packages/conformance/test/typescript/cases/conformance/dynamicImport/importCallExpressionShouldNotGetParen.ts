/*---
description: Ported from TypeScript's tests/cases/conformance/dynamicImport/importCallExpressionShouldNotGetParen.ts.
outcome: throws
source: tests/cases/conformance/dynamicImport/importCallExpressionShouldNotGetParen.ts
---*/
// @module: es2020
// @target: es6
// @noImplicitAny: true
const localeName = "zh-CN";
import(`./locales/${localeName}.js`).then(bar => {
    let x = bar;
});

import("./locales/" + localeName + ".js").then(bar => {
    let x = bar;
});

/*--- recorded
all:
  exit: 1
  transcript: throws
---*/
