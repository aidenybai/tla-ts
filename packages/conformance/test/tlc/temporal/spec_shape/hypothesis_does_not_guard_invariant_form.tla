(*---
description: 'A property of the form []P is checked as an invariant on every reachable state, so a temporal hypothesis cannot excuse it.'
ref: tlc2/tool/impl/SpecProcessor.java#processConfigProps
features: [liveness]
outcome: safety-violation
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE hypothesis_does_not_guard_invariant_form ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x < 2 /\ x' = x + 1

Spec == Init /\ [][Next]_x /\ <>(x = 99)
Prop == [](x = 99)
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2107:1 Invariant Prop is violated by the initial state:
    x = 0
---*)
