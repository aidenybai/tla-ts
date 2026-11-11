(*---
description: 4202 fires for a constant named STRING.
ref: "tla2sany/semantic/SymbolTable.java#addSymbol"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE builtin_as_constant ----
CONSTANT STRING
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 10 to line 8, col 15 of module builtin_as_constant
    | Symbol STRING is a built-in operator, and cannot be redefined.
    3002:1 Parsing or semantic analysis failed.
---*)
