(*---
description: 4354 fires for PICK at action level with a temporal body.
ref: "tla2sany/semantic/Generator.java#generateProof"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE proof_pick_action_bound_temporal ----
VARIABLE v
THEOREM TRUE
<1> PICK x \in v' : []v
<1> QED
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 10, col 16 to line 10, col 17 of module proof_pick_action_bound_temporal
    | Non-constant bound of temporal PICK.
    3002:1 Parsing or semantic analysis failed.
---*)
