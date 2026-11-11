(*---
description: A parameter may not reuse a defined name.
ref: "tla2sany/semantic/SymbolTable.java#addSymbol"
features: [parameterized]
outcome: parse-error
---*)
---- MODULE parameter_clashes_with_definition ----
A == 1
---- MODULE I ----
====
M(A) == INSTANCE I
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 11, col 3 to line 11, col 3 of module parameter_clashes_with_definition
    | Multiply-defined symbol 'A': this definition or declaration conflicts 
    | with the one at line 8, col 1 to line 8, col 6 of module parameter_clashes_with_definition.
    3002:1 Parsing or semantic analysis failed.
---*)
