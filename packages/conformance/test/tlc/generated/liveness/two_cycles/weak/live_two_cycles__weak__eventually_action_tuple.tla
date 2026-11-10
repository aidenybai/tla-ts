(*---
description: Checks eventually_action_tuple on the two_cycles machine under weak fairness.
ref: tlc2/tool/liveness/LiveCheck.java; tlc2/tool/liveness/Liveness.java
features:
  - liveness
outcome: any
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE live_two_cycles__weak__eventually_action_tuple ----
EXTENDS Integers
VARIABLE x
Next == \/ x \in {0, 1} /\ x' = 1 - x
        \/ x = 1 /\ x' = 2
        \/ x = 2 /\ x' = 2
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Prop == <><<x' = 1>>_<<x>>
====

(*--- recorded
all:
  exit: 255
  transcript: 2214:1 Temporal formulas containing actions must be of forms <>[]A or []<>A.
---*)
