/*---
description: Ported from TypeScript's tests/cases/conformance/es2019/allowUnescapedParagraphAndLineSeparatorsInStringLiteral.ts.
outcome: success
source: tests/cases/conformance/es2019/allowUnescapedParagraphAndLineSeparatorsInStringLiteral.ts
---*/
// @target: es2015
// Strings containing unescaped line / paragraph separators
// Using both single quotes, double quotes and template literals

var stringContainingUnescapedLineSeparator1 = " STRING_CONTENT ";
var stringContainingUnescapedParagraphSeparator1 = " STRING_CONTENT ";


var stringContainingUnescapedLineSeparator2 = ' STRING_CONTENT ';
var stringContainingUnescapedParagraphSeparator2 = ' STRING_CONTENT ';


var stringContainingUnescapedLineSeparator3 = ` STRING_CONTENT `;
var stringContainingUnescapedParagraphSeparator3 = ` STRING_CONTENT `;

// Array of unescaped line / paragraph separators

var arr = [
    "  STRING_CONTENT  ",
    "   STRING_CONTENT   ",
    "STRING_CONTENT ",
    " STRING_CONTENT",
    `\ `,
    ' '
];

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
