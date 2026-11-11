(*---
description: A step reference with no such step is rejected.
ref: "tla2sany/semantic/Generator.java#generateProof"
features: [proofs]
outcome: parse-error
---*)
---- MODULE step_reference_undefined ----
THEOREM TRUE
<1>1. TRUE BY <1>2
<1> QED
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 15 to line 9, col 18 of module step_reference_undefined
    | Unknown operator: `<1>2'.
    3002:1 Parsing or semantic analysis failed.
---*)
