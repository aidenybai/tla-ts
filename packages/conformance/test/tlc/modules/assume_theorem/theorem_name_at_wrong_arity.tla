(*---
description: A theorem name takes no arguments.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [assume_theorem]
outcome: parse-error
---*)
---- MODULE theorem_name_at_wrong_arity ----
THEOREM T == TRUE
A == T(1)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 7 to line 9, col 9 of module theorem_name_at_wrong_arity
    | The operator T requires 0 arguments.
    3002:1 Parsing or semantic analysis failed.
---*)
