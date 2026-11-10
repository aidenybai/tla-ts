/*---
description: Ported from TypeScript's tests/cases/conformance/es6/templates/taggedTemplateStringsWithTagsTypedAsAnyES6.ts.
outcome: throws
source: tests/cases/conformance/es6/templates/taggedTemplateStringsWithTagsTypedAsAnyES6.ts
---*/
﻿// @target: ES6
var f: any;
f `abc`

f `abc${1}def${2}ghi`;

f.g.h `abc`

f.g.h `abc${1}def${2}ghi`;

f `abc`.member

f `abc${1}def${2}ghi`.member;

f `abc`["member"];

f `abc${1}def${2}ghi`["member"];

f `abc`["member"].someOtherTag `abc${1}def${2}ghi`;

f `abc${1}def${2}ghi`["member"].someOtherTag `abc${1}def${2}ghi`;

f.thisIsNotATag(`abc`);

f.thisIsNotATag(`abc${1}def${2}ghi`);

/*--- recorded
all:
  exit: 1
  transcript: throws
---*/
