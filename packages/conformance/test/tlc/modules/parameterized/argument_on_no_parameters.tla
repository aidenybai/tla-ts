(*---
description: An instance without parameters takes no arguments.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [parameterized]
outcome: parse-error
---*)
---- MODULE argument_on_no_parameters ----
---- MODULE I ----
CONSTANT c
d == c
====
M == INSTANCE I WITH c <- 1
Test == M(1)!d = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 13, col 10 to line 13, col 12 of module argument_on_no_parameters
    | The operator M requires 0 arguments.
    3002:1 Parsing or semantic analysis failed.
---*)
