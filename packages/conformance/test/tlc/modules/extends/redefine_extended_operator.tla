(*---
description: "A definition may not reuse an extended operator's name."
ref: "tla2sany/semantic/SymbolTable.java#addSymbol"
features: [extends]
includes: [FixExtA.tla]
outcome: parse-error
---*)
---- MODULE redefine_extended_operator ----
EXTENDS FixExtA
Shared == 2
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | *** Warnings: 1
    | line 10, col 1 to line 10, col 11 of module redefine_extended_operator
    | Multiple declarations or definitions for symbol Shared.  
    | This duplicates the one at line 2, col 1 to line 2, col 11 of module FixExtA.
    | Semantic errors:
    | *** Errors: 1
    | line 10, col 1 to line 10, col 11 of module redefine_extended_operator
    | Operator Shared already defined or declared.
    3002:1 Parsing or semantic analysis failed.
---*)
