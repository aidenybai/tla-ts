/*---
description: Ported from TypeScript's tests/cases/compiler/emitPreComments.ts.
outcome: success
source: tests/cases/compiler/emitPreComments.ts
---*/
// @target: es2015
// @removeComments: false

// This is pre comment
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
