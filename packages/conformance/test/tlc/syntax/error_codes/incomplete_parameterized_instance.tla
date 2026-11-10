(*---
description: 4203 fires for a parameterized instance name with arguments and no selector.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE incomplete_parameterized_instance ----
---- MODULE I ----
A == 1
====
M(x) == INSTANCE I
Test == M(1) = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 12, col 9 to line 12, col 9 of module incomplete_parameterized_instance
    | Operator name M is incomplete.
    3002:1 Parsing or semantic analysis failed.
---*)
