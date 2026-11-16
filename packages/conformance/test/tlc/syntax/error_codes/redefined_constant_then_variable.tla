(*---
description: "4201 fires for a VARIABLE reusing a constant's name."
ref: "tla2sany/semantic/SymbolTable.java#addSymbol"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE redefined_constant_then_variable ----
CONSTANT c
VARIABLE c
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 10 to line 9, col 10 of module redefined_constant_then_variable
    | Multiply-defined symbol 'c': this definition or declaration conflicts 
    | with the one at line 8, col 10 to line 8, col 10 of module redefined_constant_then_variable.
    3002:1 Parsing or semantic analysis failed.
---*)
