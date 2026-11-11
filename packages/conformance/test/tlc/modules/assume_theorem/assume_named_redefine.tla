(*---
description: "An assumption's name may not repeat a symbol."
ref: "tla2sany/semantic/SymbolTable.java#addSymbol"
features: [assume_theorem]
outcome: parse-error
---*)
---- MODULE assume_named_redefine ----
A == 1
ASSUME A == TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 1 to line 9, col 16 of module assume_named_redefine
    | Multiply-defined symbol 'A': this definition or declaration conflicts 
    | with the one at line 8, col 1 to line 8, col 6 of module assume_named_redefine.
    3002:1 Parsing or semantic analysis failed.
---*)
