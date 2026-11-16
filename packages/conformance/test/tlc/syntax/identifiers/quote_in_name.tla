(*---
description: "a' == 1 is a postfix definition of the built-in prime, so it is a redefinition error rather than a syntax error."
ref: "tla2sany/semantic/SymbolTable.java#addSymbol"
features: [identifiers]
outcome: parse-error
---*)
---- MODULE quote_in_name ----
a' == 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 8, col 1 to line 8, col 7 of module quote_in_name
    | Operator ' already defined or declared.
    | line 8, col 1 to line 8, col 7 of module quote_in_name
    | Symbol ' is a built-in operator, and cannot be redefined.
    3002:1 Parsing or semantic analysis failed.
---*)
