/*---
description: Ported from TypeScript's tests/cases/compiler/sourceMap-LineBreaks.ts.
outcome: success
source: tests/cases/compiler/sourceMap-LineBreaks.ts
---*/
// @target: ES5, ES2015
// @sourcemap: true
var endsWithlineSeparator = 10;  var endsWithParagraphSeparator = 10;  var endsWithNextLine = 1;var endsWithLineFeed = 1;
var endsWithCarriageReturnLineFeed = 1;
var endsWithCarriageReturn = 1;
var endsWithLineFeedCarriageReturn = 1;

var endsWithLineFeedCarriageReturnLineFeed = 1;

var stringLiteralWithLineFeed = "line 1\
line 2";
var stringLiteralWithCarriageReturnLineFeed = "line 1\
line 2";
var stringLiteralWithCarriageReturn = "line 1\
line 2";

var stringLiteralWithLineSeparator = "line 1\ line 2"; var stringLiteralWithParagraphSeparator = "line 1\ line 2"; var stringLiteralWithNextLine = "line 1\line 2";

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
