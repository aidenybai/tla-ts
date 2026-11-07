(*---
description: Too many arguments to a parameterized instance is rejected.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [parameterized]
outcome: parse-error
---*)
---- MODULE too_many_arguments ----
---- MODULE I ----
CONSTANT c
d == c
====
M(a) == INSTANCE I WITH c <- a
Test == M(1, 2)!d = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 13, col 10 to line 13, col 15 of module too_many_arguments
    | The operator M requires 1 arguments.
    3002:1 Parsing or semantic analysis failed.
---*)
