(*---
description: "A function's name is only in scope in its own body, so a helper before it cannot use it."
ref: "tla2sany/semantic/Generator.java#processFunction"
features: [recursive]
outcome: parse-error
---*)
---- MODULE recursive_function_through_definition_undeclared ----
G(n) == f[n]
f[n \in {1}] == G(n)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 9 to line 8, col 9 of module recursive_function_through_definition_undeclared
    | Unknown operator: `f'.
    3002:1 Parsing or semantic analysis failed.
---*)
