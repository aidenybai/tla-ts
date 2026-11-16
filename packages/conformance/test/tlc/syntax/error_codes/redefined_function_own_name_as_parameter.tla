(*---
description: "4201 fires for a function parameter equal to the function's name."
ref: "tla2sany/semantic/SymbolTable.java#addSymbol"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE redefined_function_own_name_as_parameter ----
f[f \in {1}] == 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 1 to line 8, col 17 of module redefined_function_own_name_as_parameter
    | Function name `f' already defined or declared.
    3002:1 Parsing or semantic analysis failed.
---*)
