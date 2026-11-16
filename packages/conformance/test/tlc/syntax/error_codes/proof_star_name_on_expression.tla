(*---
description: "4350 fires for a named <*> step that is not QED."
ref: "tla2sany/semantic/Generator.java#generateProof"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE proof_star_name_on_expression ----
THEOREM TRUE
<*>a. TRUE
<*> QED
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 1 to line 9, col 5 of module proof_star_name_on_expression
    | <*> and <+> cannot be used for a named step.
    3002:1 Parsing or semantic analysis failed.
---*)
