(*---
description: 'Invariants from the INVARIANT line precede those from properties.'
ref: tlc2/tool/ModelChecker.java#doInit
features: [liveness]
outcome: safety-violation
config: |
  SPECIFICATION Spec
  INVARIANT Inv
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE invariant_config_before_property_invariant ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Inv == x = 1
Prop == [](x = 2)
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2107:1 Invariant Inv is violated by the initial state:
    x = 0
---*)
