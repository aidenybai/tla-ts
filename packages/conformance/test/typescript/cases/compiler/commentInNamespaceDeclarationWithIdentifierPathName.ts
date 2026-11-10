/*---
description: Ported from TypeScript's tests/cases/compiler/commentInNamespaceDeclarationWithIdentifierPathName.ts.
outcome: success
source: tests/cases/compiler/commentInNamespaceDeclarationWithIdentifierPathName.ts
---*/
﻿// @target: es2015
namespace hello.hi.world
{
    function foo() {}

    // TODO, blah
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
