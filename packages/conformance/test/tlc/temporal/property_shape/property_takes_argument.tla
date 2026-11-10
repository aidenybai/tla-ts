(*---
description: 'A PROPERTY operator with a parameter fails with TLC_CONFIG_ID_REQUIRES_NO_ARG.'
ref: tlc2/tool/impl/SpecProcessor.java#processSpec
features: [liveness]
outcome: config-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE property_takes_argument ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Prop(n) == x = n
====

(*--- recorded
all:
  exit: 151
  transcript: 2228:1 TLC requires Prop not to take any argument.
---*)
