(*---
description: SANY still resolves names in an unchecked proof.
ref: "tla2sany/semantic/Generator.java#generateProof"
features: [proofs]
outcome: parse-error
---*)
---- MODULE undefined_name_in_proof ----
THEOREM TRUE BY DoesNotExist
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 17 to line 8, col 28 of module undefined_name_in_proof
    | Unknown operator: `DoesNotExist'.
    3002:1 Parsing or semantic analysis failed.
---*)
