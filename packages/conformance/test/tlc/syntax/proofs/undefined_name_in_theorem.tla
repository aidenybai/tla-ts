(*---
description: SANY still resolves names in an unchecked theorem.
ref: "tla2sany/semantic/Generator.java#processTheorem"
features: [proofs]
outcome: parse-error
---*)
---- MODULE undefined_name_in_theorem ----
THEOREM DoesNotExist
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 9 to line 8, col 20 of module undefined_name_in_theorem
    | Unknown operator: `DoesNotExist'.
    3002:1 Parsing or semantic analysis failed.
---*)
