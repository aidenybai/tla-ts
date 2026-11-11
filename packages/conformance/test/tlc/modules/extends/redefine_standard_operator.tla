(*---
description: A definition may not reuse an operator from an extended standard module.
ref: "tla2sany/semantic/SymbolTable.java#addSymbol"
features: [extends]
outcome: parse-error
---*)
---- MODULE redefine_standard_operator ----
EXTENDS Naturals
Nat == 2
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | *** Warnings: 1
    | line 9, col 1 to line 9, col 8 of module redefine_standard_operator
    | Multiple declarations or definitions for symbol Nat.  
    | This duplicates the one at line 14, col 1 to line 14, col 16 of module Naturals.
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 1 to line 9, col 8 of module redefine_standard_operator
    | Operator Nat already defined or declared.
    3002:1 Parsing or semantic analysis failed.
---*)
