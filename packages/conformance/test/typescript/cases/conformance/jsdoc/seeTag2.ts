/*---
description: Ported from TypeScript's tests/cases/conformance/jsdoc/seeTag2.ts.
outcome: success
source: tests/cases/conformance/jsdoc/seeTag2.ts
---*/
// @target: es2015
// @declaration: true

/** @see {} empty*/
const a = ""

/** @see {aaaaaa} unknown name*/
const b = ""

/** @see {?????} invalid */
const c = ""

/** @see c without brace */
const d = ""

/** @see ?????? wowwwwww*/
const e = ""

/** @see {}*/
const f = ""

/** @see */
const g = ""

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
