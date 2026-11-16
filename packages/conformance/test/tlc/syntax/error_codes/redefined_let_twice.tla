(*---
description: 4201 fires for two LET definitions with one name.
ref: "tla2sany/semantic/SymbolTable.java#addSymbol"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE redefined_let_twice ----
A == LET a == 1
         a == 2
     IN a
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | *** Warnings: 1
    | line 9, col 10 to line 9, col 15 of module redefined_let_twice
    | Multiple declarations or definitions for symbol a.  
    | This duplicates the one at line 8, col 10 to line 8, col 15 of module redefined_let_twice.
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 10 to line 9, col 15 of module redefined_let_twice
    | Operator a already defined or declared.
    3002:1 Parsing or semantic analysis failed.
---*)
