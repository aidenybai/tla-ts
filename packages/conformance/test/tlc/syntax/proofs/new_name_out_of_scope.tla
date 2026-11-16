(*---
description: A NEW name is not visible after its theorem.
ref: "tla2sany/semantic/Generator.java#generateNewSymb"
features: [proofs]
outcome: parse-error
---*)
---- MODULE new_name_out_of_scope ----
THEOREM ASSUME NEW x PROVE TRUE
A == x
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 6 to line 9, col 6 of module new_name_out_of_scope
    | Unknown operator: `x'.
    3002:1 Parsing or semantic analysis failed.
---*)
