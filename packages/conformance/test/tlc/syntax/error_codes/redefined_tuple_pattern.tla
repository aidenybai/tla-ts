(*---
description: 4201 fires for one name twice in a tuple pattern.
ref: "tla2sany/semantic/SymbolTable.java#addSymbol"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE redefined_tuple_pattern ----
A == \A <<x, x>> \in {<<1, 2>>} : TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 14 to line 8, col 14 of module redefined_tuple_pattern
    | Multiply-defined symbol 'x': this definition or declaration conflicts 
    | with the one at line 8, col 11 to line 8, col 11 of module redefined_tuple_pattern.
    3002:1 Parsing or semantic analysis failed.
---*)
