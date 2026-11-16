(*---
description: A parameterized operator needs its arguments before the selector.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
outcome: parse-error
---*)
---- MODULE parameterized_without_arguments ----
EXTENDS Naturals
Op(x) == 1 + x
Test == Op!1 = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 10, col 9 to line 10, col 12 of module parameterized_without_arguments
    | The operator Op requires 1 arguments.
    3002:1 Parsing or semantic analysis failed.
---*)
