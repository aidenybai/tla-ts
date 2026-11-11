(*---
description: 4201 fires for a function parameter equal to a definition.
ref: "tla2sany/semantic/SymbolTable.java#addSymbol"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE redefined_function_parameter ----
x == 1
f[x \in {1}] == 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 3 to line 9, col 3 of module redefined_function_parameter
    | Multiply-defined symbol 'x': this definition or declaration conflicts 
    | with the one at line 8, col 1 to line 8, col 6 of module redefined_function_parameter.
    3002:1 Parsing or semantic analysis failed.
---*)
