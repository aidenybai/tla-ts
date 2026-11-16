(*---
description: "M!N alone is incomplete when N is an instance."
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
outcome: parse-error
---*)
---- MODULE nested_instance_name_incomplete ----
---- MODULE J ----
A == 7
====
---- MODULE I ----
N == INSTANCE J
====
M == INSTANCE I
Test == M!N = 7
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 15, col 11 to line 15, col 11 of module nested_instance_name_incomplete
    | Operator name M!N is incomplete.
    3002:1 Parsing or semantic analysis failed.
---*)
