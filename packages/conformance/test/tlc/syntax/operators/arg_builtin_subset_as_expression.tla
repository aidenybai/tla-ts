(*---
description: SUBSET passed where an expression is required makes SANY name its internal node kind, N_GenNonExpPrefixOp, instead of saying the operator needs an argument.
ref: tla2sany/semantic/Generator.java#generateExpression
features:
  - operators
  - tlc-bug
outcome: parse-error
correct:
  all:
    exit: 150
    transcript: |-
      | Semantic errors:
      | *** Errors: 1
      | line 20, col 12 to line 20, col 17 of module arg_builtin_subset_as_expression
      | The operator SUBSET requires 1 arguments.
      3002:1 Parsing or semantic analysis failed.
---*)
---- MODULE arg_builtin_subset_as_expression ----
Id(a) == a
Test == Id(SUBSET)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 20, col 12 to line 20, col 17 of module arg_builtin_subset_as_expression
    | Unsupported expression type `N_GenNonExpPrefixOp'.
    3002:1 Parsing or semantic analysis failed.
---*)
