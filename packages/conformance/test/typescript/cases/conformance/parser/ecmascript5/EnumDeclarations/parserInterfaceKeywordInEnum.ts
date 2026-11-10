/*---
description: Ported from TypeScript's tests/cases/conformance/parser/ecmascript5/EnumDeclarations/parserInterfaceKeywordInEnum.ts.
outcome: success
source: tests/cases/conformance/parser/ecmascript5/EnumDeclarations/parserInterfaceKeywordInEnum.ts
---*/
// @target: es2015
enum Bar {
    interface,
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
