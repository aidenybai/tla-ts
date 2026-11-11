(*---
description: 4201 fires for a LET name equal to a parameter.
ref: "tla2sany/semantic/SymbolTable.java#addSymbol"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE redefined_let_vs_parameter ----
A(a) == LET a == 1 IN a
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 8, col 13 to line 8, col 18 of module redefined_let_vs_parameter
    | Operator a already defined or declared.
    | line 8, col 13 to line 8, col 18 of module redefined_let_vs_parameter
    | Multiply-defined symbol 'a': this definition or declaration conflicts 
    | with the one at line 8, col 3 to line 8, col 3 of module redefined_let_vs_parameter.
    3002:1 Parsing or semantic analysis failed.
---*)
