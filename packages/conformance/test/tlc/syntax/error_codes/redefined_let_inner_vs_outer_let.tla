(*---
description: 4201 fires for a nested LET reusing an outer LET name.
ref: "tla2sany/semantic/SymbolTable.java#addSymbol"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE redefined_let_inner_vs_outer_let ----
A == LET a == 1 IN LET a == 2 IN a
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | *** Warnings: 1
    | line 8, col 24 to line 8, col 29 of module redefined_let_inner_vs_outer_let
    | Multiple declarations or definitions for symbol a.  
    | This duplicates the one at line 8, col 10 to line 8, col 15 of module redefined_let_inner_vs_outer_let.
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 24 to line 8, col 29 of module redefined_let_inner_vs_outer_let
    | Operator a already defined or declared.
    3002:1 Parsing or semantic analysis failed.
---*)
