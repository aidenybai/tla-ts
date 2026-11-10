(*---
description: A nested module may not declare a name the outer module defined.
ref: "tla2sany/semantic/SymbolTable.java#addSymbol"
features: [nested]
outcome: parse-error
---*)
---- MODULE inner_declares_outer_name ----
A == 7
---- MODULE I ----
CONSTANT A
====
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 10, col 10 to line 10, col 10 of module inner_declares_outer_name
    | Multiply-defined symbol 'A': this definition or declaration conflicts 
    | with the one at line 8, col 1 to line 8, col 6 of module inner_declares_outer_name.
    3002:1 Parsing or semantic analysis failed.
---*)
