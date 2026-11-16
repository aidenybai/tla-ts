(*---
description: A LOCAL name may not repeat in its module.
ref: "tla2sany/semantic/SymbolTable.java#addSymbol"
features: [local]
outcome: parse-error
---*)
---- MODULE local_redefines_local ----
LOCAL A == 1
LOCAL A == 2
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | *** Warnings: 1
    | line 9, col 1 to line 9, col 12 of module local_redefines_local
    | Multiple declarations or definitions for symbol A.  
    | This duplicates the one at line 8, col 1 to line 8, col 12 of module local_redefines_local.
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 1 to line 9, col 12 of module local_redefines_local
    | Operator A already defined or declared.
    3002:1 Parsing or semantic analysis failed.
---*)
