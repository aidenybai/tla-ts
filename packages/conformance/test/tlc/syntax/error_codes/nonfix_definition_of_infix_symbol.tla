(*---
description: "A nonfix definition of an infix symbol is a parse error, before any redefinition check."
ref: "tla2sany/semantic/SymbolTable.java#addSymbol"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE nonfix_definition_of_infix_symbol ----
a ++ b == 1
++(a) == 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "Beginning of definition" at line 9, column 3 and token "++" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 9, column 3.
    | ExtendableExpr starting at line 8, column 11.
    | Expression starting at line 8, column 11.
    | Definition starting at line 8, column 1.
    | Module body starting at line 8, column 1.
    | Fatal errors while parsing TLA+ spec in file nonfix_definition_of_infix_symbol
    | In module nonfix_definition_of_infix_symbol
    | Could not parse module nonfix_definition_of_infix_symbol from file nonfix_definition_of_infix_symbol.tla
    | *** Errors: 1
    | In module nonfix_definition_of_infix_symbol
    | Could not parse module nonfix_definition_of_infix_symbol from file nonfix_definition_of_infix_symbol.tla
    3002:1 Parsing or semantic analysis failed.
---*)
