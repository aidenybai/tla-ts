(*---
description: 4201 fires for a nested quantifier reusing a bound name.
ref: "tla2sany/semantic/SymbolTable.java#addSymbol"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE redefined_bound_nested ----
A == \A x \in {1} : \E x \in {1} : TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 24 to line 8, col 24 of module redefined_bound_nested
    | Multiply-defined symbol 'x': this definition or declaration conflicts 
    | with the one at line 8, col 9 to line 8, col 9 of module redefined_bound_nested.
    3002:1 Parsing or semantic analysis failed.
---*)
