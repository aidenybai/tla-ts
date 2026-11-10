/*---
description: Ported from TypeScript's tests/cases/conformance/parser/ecmascript5/parserSbp_7.9_A9_T3.ts.
outcome: success
source: tests/cases/conformance/parser/ecmascript5/parserSbp_7.9_A9_T3.ts
---*/
// @target: es2015
// Copyright 2009 the Sputnik authors.  All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/**
 * Check Do-While Statement for automatic semicolon insertion
 *
 * @path bestPractice/Sbp_7.9_A9_T3.js
 * @description Execute do { \n ; \n }while(false) true
 */

//CHECK#1
do {
  ;
} while (false) true

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
