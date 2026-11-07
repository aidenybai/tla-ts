(*---
description: Checks case_formula on the many_starts machine under unfair fairness.
ref: tlc2/tool/liveness/LiveCheck.java; tlc2/tool/liveness/Liveness.java
features:
  - liveness
outcome: any
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE live_many_starts__unfair__case_formula ----
EXTENDS Integers
VARIABLE x
Next == x' = (x + 1) % 3
Spec == x \in 0..2 /\ [][Next]_x
Prop == CASE TRUE -> <>(x = 1) [] OTHER -> <>(x = 2)
====

(*--- recorded
all:
  exit: 255
  transcript: 2213:1 TLC cannot handle the temporal formula line 17, col 9 to line 17, col 52 of module live_many_starts__unfair__case_formula
---*)
