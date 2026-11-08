(*---
description: 'A universal with a state-dependent set and a temporal body cannot be translated: TLC_LIVE_CANNOT_HANDLE_FORMULA with the cause.'
ref: tlc2/tool/liveness/Liveness.java#astToLiveAppl
features: [liveness]
outcome: tlc-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE forall_non_constant_set_temporal_body ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Prop == \A n \in {x} : <>(x = n)
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    2213:1 TLC cannot handle the temporal formula line 16, col 9 to line 16, col 32 of module forall_non_constant_set_temporal_body:
    2280:0 In evaluation, the identifier x is either undefined or not an operator.
    line 16, col 19 to line 16, col 19 of module forall_non_constant_set_temporal_body
---*)
