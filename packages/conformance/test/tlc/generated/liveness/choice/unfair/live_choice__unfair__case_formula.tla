(*---
description: Checks case_formula on the choice machine under unfair fairness.
ref: tlc2/tool/liveness/LiveCheck.java; tlc2/tool/liveness/Liveness.java
features:
  - liveness
outcome: any
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE live_choice__unfair__case_formula ----
EXTENDS Integers
VARIABLE x
Next == \/ x = 0 /\ x' \in {1, 2}
        \/ x = 1 /\ x' = 1
        \/ x = 2 /\ x' = 0
Spec == x = 0 /\ [][Next]_x
Prop == CASE TRUE -> <>(x = 1) [] OTHER -> <>(x = 2)
====

(*--- recorded
all:
  exit: 255
  transcript: 2213:1 TLC cannot handle the temporal formula line 19, col 9 to line 19, col 52 of module live_choice__unfair__case_formula
---*)
