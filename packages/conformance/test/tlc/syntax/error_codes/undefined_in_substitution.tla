(*---
description: 4200 fires inside a WITH substitution.
ref: "tla2sany/semantic/Generator.java#processSubst"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE undefined_in_substitution ----
---- MODULE I ----
CONSTANT c
d == c
====
M == INSTANCE I WITH c <- Missing
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 12, col 27 to line 12, col 33 of module undefined_in_substitution
    | Unknown operator: `Missing'.
    3002:1 Parsing or semantic analysis failed.
---*)
