(*---
description: Checks eventually_action on the dead_end machine under weak fairness.
ref: tlc2/tool/liveness/LiveCheck.java; tlc2/tool/liveness/Liveness.java
features:
  - liveness
outcome: any
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE live_dead_end__weak__eventually_action ----
EXTENDS Integers
VARIABLE x
Next == x = 0 /\ x' = 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Prop == <><<x' = x + 1>>_x
====

(*--- recorded
all:
  exit: 255
  transcript: 2214:1 Temporal formulas containing actions must be of forms <>[]A or []<>A.
---*)
