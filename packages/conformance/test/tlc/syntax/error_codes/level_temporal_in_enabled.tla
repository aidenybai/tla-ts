(*---
description: 4205 fires for a temporal formula under ENABLED.
ref: "tla2sany/semantic/OpApplNode.java#levelCheck"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE level_temporal_in_enabled ----
VARIABLE v
A == ENABLED []v
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 6 to line 9, col 16 of module level_temporal_in_enabled
    | Level error in applying operator ENABLED:
    | The level of argument 1 exceeds the maximum level allowed by the operator.
    3002:1 Parsing or semantic analysis failed.
---*)
