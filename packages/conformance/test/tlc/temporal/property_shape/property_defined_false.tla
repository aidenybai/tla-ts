(*---
description: 'A property defined as FALSE is not a true BoolValue, so it fails with TLC_CONFIG_ID_HAS_VALUE and not the trivial-spec error.'
ref: tlc2/tool/impl/SpecProcessor.java#processSpec
features: [liveness]
outcome: config-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE property_defined_false ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Prop == FALSE
====

(*--- recorded
all:
  exit: 151
  transcript: 2230:1 The property of Prop is equal to FALSE
---*)
