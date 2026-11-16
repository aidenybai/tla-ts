(*---
description: LOCAL does not make a redefinition legal.
ref: "tla2sany/semantic/SymbolTable.java#addSymbol"
features: [local]
outcome: parse-error
---*)
---- MODULE local_redefines_extended ----
EXTENDS Naturals
LOCAL Nat == 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | *** Warnings: 1
    | line 9, col 1 to line 9, col 14 of module local_redefines_extended
    | Multiple declarations or definitions for symbol Nat.  
    | This duplicates the one at line 14, col 1 to line 14, col 16 of module Naturals.
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 1 to line 9, col 14 of module local_redefines_extended
    | Operator Nat already defined or declared.
    3002:1 Parsing or semantic analysis failed.
---*)
