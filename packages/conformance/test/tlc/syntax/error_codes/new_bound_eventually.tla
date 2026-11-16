(*---
description: 4356 fires for an eventually bound on NEW.
ref: "tla2sany/semantic/Generator.java#generateProof"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE new_bound_eventually ----
VARIABLE v
THEOREM ASSUME NEW x \in <>v PROVE TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 16 to line 9, col 28 of module new_bound_eventually
    | Level error:
    | Temporal formula used as set.
    3002:1 Parsing or semantic analysis failed.
---*)
