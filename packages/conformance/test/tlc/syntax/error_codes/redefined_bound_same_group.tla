(*---
description: 4201 fires for one name twice in a bound group.
ref: "tla2sany/semantic/SymbolTable.java#addSymbol"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE redefined_bound_same_group ----
A == \A x, x \in {1} : TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 12 to line 8, col 12 of module redefined_bound_same_group
    | Multiply-defined symbol 'x': this definition or declaration conflicts 
    | with the one at line 8, col 9 to line 8, col 9 of module redefined_bound_same_group.
    3002:1 Parsing or semantic analysis failed.
---*)
