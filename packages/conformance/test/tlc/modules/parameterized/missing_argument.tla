(*---
description: "A parameterized instance needs arguments before the !."
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [parameterized]
outcome: parse-error
---*)
---- MODULE missing_argument ----
---- MODULE I ----
CONSTANT c
d == c
====
M(a) == INSTANCE I WITH c <- a
Test == M!d = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 13, col 9 to line 13, col 11 of module missing_argument
    | The operator M requires 1 arguments.
    3002:1 Parsing or semantic analysis failed.
---*)
