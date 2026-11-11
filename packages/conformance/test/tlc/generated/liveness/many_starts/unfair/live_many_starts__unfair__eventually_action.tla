(*---
description: Checks eventually_action on the many_starts machine under unfair fairness.
ref: tlc2/tool/liveness/LiveCheck.java; tlc2/tool/liveness/Liveness.java
features:
  - liveness
outcome: any
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE live_many_starts__unfair__eventually_action ----
EXTENDS Integers
VARIABLE x
Next == x' = (x + 1) % 3
Spec == x \in 0..2 /\ [][Next]_x
Prop == <><<x' = x + 1>>_x
====

(*--- recorded
all:
  exit: 255
  transcript: 2214:1 Temporal formulas containing actions must be of forms <>[]A or []<>A.
---*)
