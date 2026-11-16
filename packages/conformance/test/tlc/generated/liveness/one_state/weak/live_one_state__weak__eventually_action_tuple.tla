(*---
description: Checks eventually_action_tuple on the one_state machine under weak fairness.
ref: tlc2/tool/liveness/LiveCheck.java; tlc2/tool/liveness/Liveness.java
features:
  - liveness
outcome: any
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE live_one_state__weak__eventually_action_tuple ----
EXTENDS Integers
VARIABLE x
Next == x' = x
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Prop == <><<x' = 1>>_<<x>>
====

(*--- recorded
all:
  exit: 255
  transcript: 2214:1 Temporal formulas containing actions must be of forms <>[]A or []<>A.
---*)
