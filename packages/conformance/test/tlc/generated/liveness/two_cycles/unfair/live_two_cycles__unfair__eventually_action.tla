(*---
description: Checks eventually_action on the two_cycles machine under unfair fairness.
ref: tlc2/tool/liveness/LiveCheck.java; tlc2/tool/liveness/Liveness.java
features:
  - liveness
outcome: any
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE live_two_cycles__unfair__eventually_action ----
EXTENDS Integers
VARIABLE x
Next == \/ x \in {0, 1} /\ x' = 1 - x
        \/ x = 1 /\ x' = 2
        \/ x = 2 /\ x' = 2
Spec == x = 0 /\ [][Next]_x
Prop == <><<x' = x + 1>>_x
====

(*--- recorded
all:
  exit: 255
  transcript: 2214:1 Temporal formulas containing actions must be of forms <>[]A or []<>A.
---*)
