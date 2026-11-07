(*---
description: 'Temporal existential at the top fails with TLC_SPECIFICATION_FEATURES_TEMPORAL_QUANTIFIER.'
ref: tlc2/tool/impl/SpecProcessor.java#processConfigSpec; tlc2/output/MP.java#TLC_SPECIFICATION_FEATURES_TEMPORAL_QUANTIFIER
features: [liveness]
outcome: tlc-error
config: |
  SPECIFICATION Spec
  CHECK_DEADLOCK FALSE
---*)
---- MODULE temporal_exists_rejected ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x < 2 /\ x' = x + 1

Spec == \EE y : Init /\ y = 0 /\ [][Next /\ y' = y]_<<x, y>>
====

(*--- recorded
all:
  exit: 255
  transcript: 2301:1 TLC does not support temporal existential, nor universal, quantification over state variables.
---*)
