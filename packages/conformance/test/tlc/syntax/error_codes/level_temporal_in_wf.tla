(*---
description: 4205 fires for a temporal formula as a fairness action.
ref: "tla2sany/semantic/OpApplNode.java#levelCheck"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE level_temporal_in_wf ----
VARIABLE v
A == WF_v([]v)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 6 to line 9, col 14 of module level_temporal_in_wf
    | Level error in applying operator $WF:
    | The level of argument 2 exceeds the maximum level allowed by the operator.
    3002:1 Parsing or semantic analysis failed.
---*)
