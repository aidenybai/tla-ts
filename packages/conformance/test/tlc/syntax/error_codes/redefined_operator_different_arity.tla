(*---
description: 4201 fires for one name defined at two arities.
ref: "tla2sany/semantic/SymbolTable.java#addSymbol"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE redefined_operator_different_arity ----
A == 1
A(x) == x
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 9, col 1 to line 9, col 9 of module redefined_operator_different_arity
    | Operator A already defined or declared.
    | line 9, col 1 to line 9, col 9 of module redefined_operator_different_arity
    | Multiply-defined symbol 'A': this definition or declaration conflicts 
    | with the one at line 8, col 1 to line 8, col 6 of module redefined_operator_different_arity.
    3002:1 Parsing or semantic analysis failed.
---*)
