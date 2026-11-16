(*---
description: 'A constant cannot be replaced by a state-level operator: TLC_CONFIG_SUBSTITUTION_NON_CONSTANT fires when the constant is evaluated, before the specification is processed.'
ref: tlc2/tool/impl/SpecProcessor.java#processConstantDefns
features: [liveness]
outcome: config-error
config: |
  SPECIFICATION Spec
  CONSTANT C <- Init
  CHECK_DEADLOCK FALSE
---*)
---- MODULE constant_substituted_by_init ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x < 2 /\ x' = x + 1

CONSTANT C
Spec == C /\ [][Next]_x
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    2281:1 The configuration file substitutes constant C with non-constant Init - specifically:
    2280:0 In evaluation, the identifier x is either undefined or not an operator.
    line 14, col 9 to line 14, col 9 of module constant_substituted_by_init
---*)
