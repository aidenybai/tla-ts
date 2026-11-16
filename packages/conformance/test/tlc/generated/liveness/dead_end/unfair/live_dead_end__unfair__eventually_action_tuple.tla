(*---
description: Checks eventually_action_tuple on the dead_end machine under unfair fairness.
ref: tlc2/tool/liveness/LiveCheck.java; tlc2/tool/liveness/Liveness.java
features:
  - liveness
outcome: any
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE live_dead_end__unfair__eventually_action_tuple ----
EXTENDS Integers
VARIABLE x
Next == x = 0 /\ x' = 1
Spec == x = 0 /\ [][Next]_x
Prop == <><<x' = 1>>_<<x>>
====

(*--- recorded
all:
  exit: 255
  transcript: 2214:1 Temporal formulas containing actions must be of forms <>[]A or []<>A.
---*)
