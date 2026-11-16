(*---
description: "An unnamed instance's definition with a different arity from an outer one is an error."
ref: "tla2sany/semantic/SymbolTable.java#addSymbol"
features: [instance]
outcome: parse-error
---*)
---- MODULE clash_different_arity ----
---- MODULE I ----
A == 1
====
A(x) == 7
INSTANCE I
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 1 to line 9, col 6 of module clash_different_arity
    | Multiply-defined symbol 'A': this definition or declaration conflicts 
    | with the one at line 11, col 1 to line 11, col 9 of module clash_different_arity.
    3002:1 Parsing or semantic analysis failed.
---*)
