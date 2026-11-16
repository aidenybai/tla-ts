(*---
description: 'PROPERTY naming a CONSTANT assigned FALSE fails with TLC_CONFIG_ID_HAS_VALUE, spelled as property.'
ref: tlc2/tool/impl/SpecProcessor.java#processSpec
features: [liveness]
outcome: config-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
  CONSTANT Prop = FALSE
---*)
---- MODULE property_is_false_constant ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
CONSTANT Prop
====

(*--- recorded
all:
  exit: 151
  transcript: 2230:1 The property of Prop is equal to FALSE
---*)
