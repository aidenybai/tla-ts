(*---
description: A NEW name is not visible in its own bound.
ref: "tla2sany/semantic/Generator.java#generateNewSymb"
features: [proofs]
outcome: parse-error
---*)
---- MODULE new_name_in_own_bound ----
THEOREM ASSUME NEW x \in {x} PROVE TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 27 to line 8, col 27 of module new_name_in_own_bound
    | Unknown operator: `x'.
    3002:1 Parsing or semantic analysis failed.
---*)
