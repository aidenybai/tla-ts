/*---
description: Ported from TypeScript's tests/cases/compiler/emitCommentsOnlyFile.ts.
outcome: success
source: tests/cases/compiler/emitCommentsOnlyFile.ts
---*/
// @target: es2015
// @removeComments: false

/**
* @name Foo
* @class
*/
/**#@+
* @memberOf Foo#
* @field
*/
/**
* @name bar
* @type Object[]
*/
/**#@-*/
/**
* @name Foo2
* @class
*/
/**#@+
* @memberOf Foo2#
* @field
*/
/**
* @name bar
* @type Object[]
*/
/**#@-*/

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
