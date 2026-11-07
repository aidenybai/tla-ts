(*---
description: 4201 fires for one name in two bound groups.
ref: "tla2sany/semantic/SymbolTable.java#addSymbol"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE redefined_bound_other_group ----
A == \A x \in {1}, x \in {2} : TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 20 to line 8, col 20 of module redefined_bound_other_group
    | Multiply-defined symbol 'x': this definition or declaration conflicts 
    | with the one at line 8, col 9 to line 8, col 9 of module redefined_bound_other_group.
    3002:1 Parsing or semantic analysis failed.
---*)
