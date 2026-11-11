(*---
description: 'A CONSTANT assigned a non-Boolean is rejected by TLC_CONFIG_OP_IS_EQUAL, spelled as ''used as a spec''.'
ref: tlc2/tool/impl/SpecProcessor.java#processConfigSpec
features: [liveness]
outcome: config-error
config: |
  SPECIFICATION Spec
  CONSTANT C = 3
  CHECK_DEADLOCK FALSE
---*)
---- MODULE constant_integer_conjunct ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x < 2 /\ x' = x + 1

CONSTANT C
Spec == C /\ Init /\ [][Next]_x
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    2236:1 The operator C, which equals 3,
    cannot be used as a spec
---*)
