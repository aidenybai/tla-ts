(*---
description: An instance name alone is incomplete.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
outcome: parse-error
---*)
---- MODULE instance_name_alone ----
---- MODULE I ----
A == 1
====
M == INSTANCE I
Test == M = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 12, col 9 to line 12, col 9 of module instance_name_alone
    | Operator name M is incomplete.
    3002:1 Parsing or semantic analysis failed.
---*)
