(*---
description: 4201 fires for a set filter bound equal to a definition.
ref: "tla2sany/semantic/SymbolTable.java#addSymbol"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE redefined_set_filter_bound ----
x == 1
A == {x \in {1} : TRUE}
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 7 to line 9, col 7 of module redefined_set_filter_bound
    | Multiply-defined symbol 'x': this definition or declaration conflicts 
    | with the one at line 8, col 1 to line 8, col 6 of module redefined_set_filter_bound.
    3002:1 Parsing or semantic analysis failed.
---*)
