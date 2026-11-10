/*---
description: Ported from TypeScript's tests/cases/conformance/parser/ecmascript5/EnumDeclarations/parserInterfaceKeywordInEnum1.ts.
outcome: success
source: tests/cases/conformance/parser/ecmascript5/EnumDeclarations/parserInterfaceKeywordInEnum1.ts
---*/
// @target: es2015
"use strict";

enum Bar {
    interface,
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
