(*---
description: Checks eventually_action_tuple on the reset machine under weak fairness.
ref: tlc2/tool/liveness/LiveCheck.java; tlc2/tool/liveness/Liveness.java
features:
  - liveness
outcome: any
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE live_reset__weak__eventually_action_tuple ----
EXTENDS Integers
VARIABLE x
Next == x' = IF x = 0 THEN 2 ELSE x - 1
Spec == x = 2 /\ [][Next]_x /\ WF_x(Next)
Prop == <><<x' = 1>>_<<x>>
====

(*--- recorded
all:
  exit: 255
  transcript: 2214:1 Temporal formulas containing actions must be of forms <>[]A or []<>A.
---*)
