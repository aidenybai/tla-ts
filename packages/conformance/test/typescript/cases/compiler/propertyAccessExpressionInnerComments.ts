/*---
description: Ported from TypeScript's tests/cases/compiler/propertyAccessExpressionInnerComments.ts.
outcome: success
source: tests/cases/compiler/propertyAccessExpressionInnerComments.ts
---*/
// @target: es2015
// @strict: false
/*1*/Array/*2*/./*3*/toString/*4*/

/*1*/Array
/*2*/./*3*/
    // Single-line comment
    toString/*4*/

/*1*/Array/*2*/./*3*/
    // Single-line comment
    toString/*4*/

/*1*/Array
    // Single-line comment
    /*2*/./*3*/toString/*4*/

/* Existing issue: the "2" comments below are duplicated and "3"s are missing */

/*1*/Array/*2*/?./*3*/toString/*4*/

/*1*/Array
/*2*/?./*3*/
    // Single-line comment
    toString/*4*/

/*1*/Array/*2*/?./*3*/
    // Single-line comment
    toString/*4*/

/*1*/Array
    // Single-line comment
    /*2*/?./*3*/toString/*4*/

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
