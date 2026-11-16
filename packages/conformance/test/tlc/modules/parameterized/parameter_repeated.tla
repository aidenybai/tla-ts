(*---
description: A parameter name may not repeat.
ref: "tla2sany/semantic/SymbolTable.java#addSymbol"
features: [parameterized]
outcome: parse-error
---*)
---- MODULE parameter_repeated ----
---- MODULE I ----
====
M(a, a) == INSTANCE I
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 10, col 6 to line 10, col 6 of module parameter_repeated
    | Multiply-defined symbol 'a': this definition or declaration conflicts 
    | with the one at line 10, col 3 to line 10, col 3 of module parameter_repeated.
    3002:1 Parsing or semantic analysis failed.
---*)
