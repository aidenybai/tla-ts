(*---
description: 4205 fires for a temporal formula inside a box-action.
ref: "tla2sany/semantic/OpApplNode.java#levelCheck"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE level_temporal_in_box_action ----
VARIABLE v
A == [][[]v]_v
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 8 to line 9, col 14 of module level_temporal_in_box_action
    | Level error in applying operator $SquareAct:
    | The level of argument 1 exceeds the maximum level allowed by the operator.
    3002:1 Parsing or semantic analysis failed.
---*)
