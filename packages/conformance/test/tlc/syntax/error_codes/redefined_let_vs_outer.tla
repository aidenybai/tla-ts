(*---
description: 4201 fires for a LET name equal to a module definition.
ref: "tla2sany/semantic/SymbolTable.java#addSymbol"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE redefined_let_vs_outer ----
x == 1
A == LET x == 2 IN x
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | *** Warnings: 1
    | line 9, col 10 to line 9, col 15 of module redefined_let_vs_outer
    | Multiple declarations or definitions for symbol x.  
    | This duplicates the one at line 8, col 1 to line 8, col 6 of module redefined_let_vs_outer.
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 10 to line 9, col 15 of module redefined_let_vs_outer
    | Operator x already defined or declared.
    3002:1 Parsing or semantic analysis failed.
---*)
