(*---
description: 'A state-dependent quantifier set under a box cannot be enumerated, and the level test finds it temporal.'
ref: tlc2/tool/liveness/Liveness.java#astToLiveAppl
features: [liveness]
outcome: tlc-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE forall_state_set_under_box ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Prop == [](\A n \in {x} : <>(x = n))
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    2213:1 TLC cannot handle the temporal formula line 16, col 12 to line 16, col 35 of module forall_state_set_under_box:
    2280:0 In evaluation, the identifier x is either undefined or not an operator.
    line 16, col 22 to line 16, col 22 of module forall_state_set_under_box
---*)
