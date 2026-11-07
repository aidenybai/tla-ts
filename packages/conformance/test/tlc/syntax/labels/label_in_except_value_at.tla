(*---
description: A label in the value of an EXCEPT is rejected.
ref: "tla2sany/semantic/Generator.java#generateLabel"
features: [labels]
outcome: parse-error
---*)
---- MODULE label_in_except_value_at ----
Op == [<<1>> EXCEPT ![1] = l:: @]
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 28 to line 8, col 32 of module label_in_except_value_at
    | Labels inside EXCEPT clauses are not yet implemented.
    3002:1 Parsing or semantic analysis failed.
---*)
