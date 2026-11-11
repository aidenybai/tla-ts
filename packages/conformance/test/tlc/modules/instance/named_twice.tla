(*---
description: An instance name may not repeat with different arity.
ref: "tla2sany/semantic/SymbolTable.java#addSymbol"
features: [instance]
outcome: parse-error
---*)
---- MODULE named_twice ----
---- MODULE I ----
====
M == INSTANCE I
M(a) == INSTANCE I
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 11, col 1 to line 11, col 18 of module named_twice
    | Multiply-defined symbol 'M': this definition or declaration conflicts 
    | with the one at line 10, col 1 to line 10, col 15 of module named_twice.
    3002:1 Parsing or semantic analysis failed.
---*)
