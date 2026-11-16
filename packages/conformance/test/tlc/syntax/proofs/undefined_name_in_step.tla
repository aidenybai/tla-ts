(*---
description: SANY still resolves names in a proof step.
ref: "tla2sany/semantic/Generator.java#generateProof"
features: [proofs]
outcome: parse-error
---*)
---- MODULE undefined_name_in_step ----
THEOREM TRUE
<1>1. DoesNotExist
<1> QED
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 7 to line 9, col 18 of module undefined_name_in_step
    | Unknown operator: `DoesNotExist'.
    3002:1 Parsing or semantic analysis failed.
---*)
