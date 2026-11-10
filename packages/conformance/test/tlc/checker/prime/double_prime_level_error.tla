(*---
description: x'' is a level error reported by the parser.
ref: tla2sany/semantic/OpApplNode.java#levelCheck
outcome: parse-error
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE double_prime_level_error ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x'' = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 13, col 9 to line 13, col 11 of module double_prime_level_error
    | Level error in applying operator ':
    | The level of argument 1 exceeds the maximum level allowed by the operator.
    3002:1 Parsing or semantic analysis failed.
---*)
