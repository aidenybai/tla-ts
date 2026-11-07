(*---
description: 'The temporal quantifier is detected on a nested conjunct too.'
ref: tlc2/tool/impl/SpecProcessor.java#processConfigSpec
features: [liveness]
outcome: tlc-error
config: |
  SPECIFICATION Spec
  CHECK_DEADLOCK FALSE
---*)
---- MODULE temporal_exists_conjunct ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x < 2 /\ x' = x + 1

Spec == Init /\ [][Next]_x /\ \EE y : y = y
====

(*--- recorded
all:
  exit: 255
  transcript: 2301:1 TLC does not support temporal existential, nor universal, quantification over state variables.
---*)
