(*---
description: An infix parameter may not reuse a symbol already defined by EXTENDS.
ref: "tla2sany/semantic/SymbolTable.java#addSymbol"
features: [operators]
outcome: parse-error
---*)
---- MODULE parameter_infix_shadow_standard ----
EXTENDS Naturals
Op(_ + _, a, b) == a + b
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 4 to line 9, col 8 of module parameter_infix_shadow_standard
    | Multiply-defined symbol '+': this definition or declaration conflicts 
    | with the one at line 15, col 1 to line 15, col 19 of module Naturals.
    3002:1 Parsing or semantic analysis failed.
---*)
