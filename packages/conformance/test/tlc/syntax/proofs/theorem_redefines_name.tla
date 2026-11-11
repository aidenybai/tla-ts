(*---
description: "A theorem's name may not reuse a symbol."
ref: "tla2sany/semantic/SymbolTable.java#addSymbol"
features: [proofs]
outcome: parse-error
---*)
---- MODULE theorem_redefines_name ----
A == 1
THEOREM A == TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 1 to line 9, col 17 of module theorem_redefines_name
    | Multiply-defined symbol 'A': this definition or declaration conflicts 
    | with the one at line 8, col 1 to line 8, col 6 of module theorem_redefines_name.
    3002:1 Parsing or semantic analysis failed.
---*)
