(*---
description: A PICK name is not visible after its proof.
ref: "tla2sany/semantic/Generator.java#generateProof"
features: [proofs]
outcome: parse-error
---*)
---- MODULE pick_name_out_of_scope_after_proof ----
THEOREM TRUE
<1>1. PICK x \in {1} : x = 1
<1> QED
A == x
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 11, col 6 to line 11, col 6 of module pick_name_out_of_scope_after_proof
    | Unknown operator: `x'.
    3002:1 Parsing or semantic analysis failed.
---*)
