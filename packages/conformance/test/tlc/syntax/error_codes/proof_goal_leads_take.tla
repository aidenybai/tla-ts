(*---
description: 4352 fires for TAKE with a non-constant bound and a leads-to goal.
ref: "tla2sany/semantic/Generator.java#generateProof"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE proof_goal_leads_take ----
VARIABLE v
THEOREM v ~> v
<1> TAKE x \in v
<1> QED
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 10, col 5 to line 10, col 16 of module proof_goal_leads_take
    | Non-constant TAKE, WITNESS, or HAVE for temporal goal.
    3002:1 Parsing or semantic analysis failed.
---*)
