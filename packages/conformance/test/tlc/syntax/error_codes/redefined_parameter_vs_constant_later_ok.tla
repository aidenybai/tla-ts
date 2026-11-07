(*---
description: 4201 fires for a parameter equal to an earlier constant.
ref: "tla2sany/semantic/SymbolTable.java#addSymbol"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE redefined_parameter_vs_constant_later_ok ----
CONSTANT c
A(c) == 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 3 to line 9, col 3 of module redefined_parameter_vs_constant_later_ok
    | Multiply-defined symbol 'c': this definition or declaration conflicts 
    | with the one at line 8, col 10 to line 8, col 10 of module redefined_parameter_vs_constant_later_ok.
    3002:1 Parsing or semantic analysis failed.
---*)
