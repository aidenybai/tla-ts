/*---
description: Ported from TypeScript's tests/cases/conformance/es2022/es2022LocalesObjectArgument.ts.
outcome: success
source: tests/cases/conformance/es2022/es2022LocalesObjectArgument.ts
---*/
// @target: es2022

const enUS = new Intl.Locale("en-US");
const deDE = new Intl.Locale("de-DE");
const jaJP = new Intl.Locale("ja-JP");

new Intl.Segmenter(enUS);
new Intl.Segmenter([deDE, jaJP]);
Intl.Segmenter.supportedLocalesOf(enUS);
Intl.Segmenter.supportedLocalesOf([deDE, jaJP]);

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
