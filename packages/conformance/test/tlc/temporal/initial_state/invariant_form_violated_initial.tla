(*---
description: 'A []P PROPERTY false in the initial state exits 12 with TLC_INVARIANT_VIOLATED_INITIAL.'
ref: tlc2/tool/ModelChecker.java#doInit
features: [liveness]
outcome: safety-violation
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE invariant_form_violated_initial ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Prop == [](x = 1)
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2107:1 Invariant Prop is violated by the initial state:
    x = 0
---*)
