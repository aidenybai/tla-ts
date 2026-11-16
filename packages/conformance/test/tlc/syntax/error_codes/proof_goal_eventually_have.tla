(*---
description: 4352 fires for HAVE with a non-constant argument and an eventually goal.
ref: "tla2sany/semantic/Generator.java#generateProof"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE proof_goal_eventually_have ----
VARIABLE v
THEOREM <>v
<1> HAVE v
<1> QED
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 10, col 5 to line 10, col 10 of module proof_goal_eventually_have
    | Non-constant TAKE, WITNESS, or HAVE for temporal goal.
    3002:1 Parsing or semantic analysis failed.
---*)
