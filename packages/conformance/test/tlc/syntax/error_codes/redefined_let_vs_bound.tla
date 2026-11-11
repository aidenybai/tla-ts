(*---
description: 4201 fires for a LET name equal to a bound name.
ref: "tla2sany/semantic/SymbolTable.java#addSymbol"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE redefined_let_vs_bound ----
A == \A a \in {1} : LET a == 2 IN TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 8, col 25 to line 8, col 30 of module redefined_let_vs_bound
    | Operator a already defined or declared.
    | line 8, col 25 to line 8, col 30 of module redefined_let_vs_bound
    | Multiply-defined symbol 'a': this definition or declaration conflicts 
    | with the one at line 8, col 9 to line 8, col 9 of module redefined_let_vs_bound.
    3002:1 Parsing or semantic analysis failed.
---*)
