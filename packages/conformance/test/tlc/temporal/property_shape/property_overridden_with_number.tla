(*---
description: 'Overriding a property with a number triggers TLC_CONFIG_ID_HAS_VALUE, spelled as property.'
ref: tlc2/tool/impl/SpecProcessor.java#processSpec
features: [liveness]
outcome: config-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
  CONSTANT Prop = 3
---*)
---- MODULE property_overridden_with_number ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Prop == <>(x = 2)
====

(*--- recorded
all:
  exit: 151
  transcript: 2230:1 The property of Prop is equal to 3
---*)
