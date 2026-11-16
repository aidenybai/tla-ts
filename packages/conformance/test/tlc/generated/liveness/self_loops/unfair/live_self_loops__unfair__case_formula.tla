(*---
description: Checks case_formula on the self_loops machine under unfair fairness.
ref: tlc2/tool/liveness/LiveCheck.java; tlc2/tool/liveness/Liveness.java
features:
  - liveness
outcome: any
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE live_self_loops__unfair__case_formula ----
EXTENDS Integers
VARIABLE x
Next == x' \in {x, (x + 1) % 3}
Spec == x = 0 /\ [][Next]_x
Prop == CASE TRUE -> <>(x = 1) [] OTHER -> <>(x = 2)
====

(*--- recorded
all:
  exit: 255
  transcript: 2213:1 TLC cannot handle the temporal formula line 17, col 9 to line 17, col 52 of module live_self_loops__unfair__case_formula
---*)
