(*---
description: A nested module may not reuse an outer name.
ref: "tla2sany/semantic/SymbolTable.java#addSymbol"
features: [nested]
outcome: parse-error
---*)
---- MODULE inner_redefines_outer ----
A == 7
---- MODULE I ----
A == 8
====
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | *** Warnings: 1
    | line 10, col 1 to line 10, col 6 of module inner_redefines_outer
    | Multiple declarations or definitions for symbol A.  
    | This duplicates the one at line 8, col 1 to line 8, col 6 of module inner_redefines_outer.
    | Semantic errors:
    | *** Errors: 1
    | line 10, col 1 to line 10, col 6 of module inner_redefines_outer
    | Operator A already defined or declared.
    3002:1 Parsing or semantic analysis failed.
---*)
