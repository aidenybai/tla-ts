/*---
description: Ported from TypeScript's tests/cases/compiler/stradac.ts.
outcome: success
source: tests/cases/compiler/stradac.ts
---*/
﻿// @target: es2015
var x = 10;

// C++-style comment

/*
    C-Style comment
    */
    
    
function foo() {
    x++;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
