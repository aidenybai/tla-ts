(*---
description: 4201 fires for a set map bound equal to a definition.
ref: "tla2sany/semantic/SymbolTable.java#addSymbol"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE redefined_set_map_bound ----
x == 1
A == {1 : x \in {1}}
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 11 to line 9, col 11 of module redefined_set_map_bound
    | Multiply-defined symbol 'x': this definition or declaration conflicts 
    | with the one at line 8, col 1 to line 8, col 6 of module redefined_set_map_bound.
    3002:1 Parsing or semantic analysis failed.
---*)
