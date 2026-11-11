(*---
description: A parameterized label needs its argument at the selector.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [labels]
outcome: parse-error
---*)
---- MODULE parameter_argument_missing ----
Op == \A x \in {1} : l(x):: x = 1
Test == Op!l
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 12 to line 9, col 12 of module parameter_argument_missing
    | Label `l' used with wrong number of arguments.
    3002:1 Parsing or semantic analysis failed.
---*)
