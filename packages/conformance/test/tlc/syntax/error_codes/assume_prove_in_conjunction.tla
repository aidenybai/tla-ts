(*---
description: 4355 fires for an ASSUME/PROVE theorem as a conjunct.
ref: "tla2sany/semantic/Generator.java#generateProof"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE assume_prove_in_conjunction ----
THEOREM T == ASSUME TRUE PROVE TRUE
A == T /\ TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 6 to line 9, col 6 of module assume_prove_in_conjunction
    | ASSUME/PROVE used where an expression is required.
    3002:1 Parsing or semantic analysis failed.
---*)
