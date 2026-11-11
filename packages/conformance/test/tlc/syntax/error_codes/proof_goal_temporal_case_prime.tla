(*---
description: 4353 fires for CASE at action level with a temporal goal.
ref: "tla2sany/semantic/Generator.java#generateProof"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE proof_goal_temporal_case_prime ----
VARIABLE v
THEOREM []v
<1> CASE v'
<1> QED
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 10, col 5 to line 10, col 11 of module proof_goal_temporal_case_prime
    | Non-constant CASE for temporal goal.
    3002:1 Parsing or semantic analysis failed.
---*)
