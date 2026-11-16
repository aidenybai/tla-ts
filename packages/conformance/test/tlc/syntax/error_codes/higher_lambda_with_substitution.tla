(*---
description: A LAMBDA of the wrong arity in WITH is rejected.
ref: "tla2sany/semantic/Generator.java#generateOpArg"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE higher_lambda_with_substitution ----
---- MODULE I ----
CONSTANT F(_)
====
M == INSTANCE I WITH F <- LAMBDA a, b : 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 11, col 27 to line 11, col 41 of module higher_lambda_with_substitution
    | An operator must be substituted for symbol 'F', and it must have arity 1.
    3002:1 Parsing or semantic analysis failed.
---*)
