(*---
description: A constant overridden by a state-level definition is rejected.
ref: tlc2/tool/impl/SpecProcessor.java#processConstantDefns
outcome: config-error
config: |
  INIT Init
  NEXT Next
  CONSTANT N <- D
---*)
---- MODULE non_constant_rhs_for_constant ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
CONSTANT N
D == x
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    2281:1 The configuration file substitutes constant N with non-constant D - specifically:
    2280:0 In evaluation, the identifier x is either undefined or not an operator.
    line 16, col 6 to line 16, col 6 of module non_constant_rhs_for_constant
---*)
