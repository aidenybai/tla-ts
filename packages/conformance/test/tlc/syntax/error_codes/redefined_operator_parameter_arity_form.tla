(*---
description: 4201 fires for an operator parameter and a plain parameter of one name.
ref: "tla2sany/semantic/SymbolTable.java#addSymbol"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE redefined_operator_parameter_arity_form ----
A(F(_), F) == 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 9 to line 8, col 9 of module redefined_operator_parameter_arity_form
    | Multiply-defined symbol 'F': this definition or declaration conflicts 
    | with the one at line 8, col 3 to line 8, col 6 of module redefined_operator_parameter_arity_form.
    3002:1 Parsing or semantic analysis failed.
---*)
