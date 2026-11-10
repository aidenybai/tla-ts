/*---
description: Ported from TypeScript's tests/cases/compiler/commentsOnPropertyOfObjectLiteral1.ts.
outcome: success
source: tests/cases/compiler/commentsOnPropertyOfObjectLiteral1.ts
---*/
﻿// @target: es2015
var resolve = {
    id: /*! @ngInject */ (details: any) => details.id,
    id1: /* c1 */ "hello",
    id2:
        /*! @ngInject */ (details: any) => details.id,
    id3:
    /*! @ngInject */
    (details: any) => details.id,
    id4:
    /*! @ngInject */
    /* C2 */
    (details: any) => details.id,
};

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
