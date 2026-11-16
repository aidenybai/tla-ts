(*---
description: 4205 fires for UNCHANGED of a parenthesized primed variable.
ref: "tla2sany/semantic/OpApplNode.java#levelCheck"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE level_prime_in_unchanged ----
VARIABLE v
A == UNCHANGED (v')
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 6 to line 9, col 19 of module level_prime_in_unchanged
    | Level error in applying operator UNCHANGED:
    | The level of argument 1 exceeds the maximum level allowed by the operator.
    3002:1 Parsing or semantic analysis failed.
---*)
