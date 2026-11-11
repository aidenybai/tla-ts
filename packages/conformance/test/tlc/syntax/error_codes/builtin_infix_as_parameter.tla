(*---
description: "4202 fires for an operator parameter spelled \\cup."
ref: "tla2sany/semantic/SymbolTable.java#addSymbol"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE builtin_infix_as_parameter ----
A(_ \cup _) == 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 3 to line 8, col 10 of module builtin_infix_as_parameter
    | Symbol \union is a built-in operator, and cannot be redefined.
    3002:1 Parsing or semantic analysis failed.
---*)
