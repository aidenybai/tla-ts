/*---
description: Ported from TypeScript's tests/cases/compiler/emitPostComments.ts.
outcome: success
source: tests/cases/compiler/emitPostComments.ts
---*/
// @target: es2015
// @removeComments: false

var y = 10;
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
