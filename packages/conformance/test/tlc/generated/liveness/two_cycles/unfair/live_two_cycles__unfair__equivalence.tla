(*---
description: Checks equivalence on the two_cycles machine under unfair fairness.
ref: tlc2/tool/liveness/LiveCheck.java; tlc2/tool/liveness/Liveness.java
features:
  - liveness
outcome: any
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE live_two_cycles__unfair__equivalence ----
EXTENDS Integers
VARIABLE x
Next == \/ x \in {0, 1} /\ x' = 1 - x
        \/ x = 1 /\ x' = 2
        \/ x = 2 /\ x' = 2
Spec == x = 0 /\ [][Next]_x
Prop == <>(x = 1) <=> <>(x = 2)
====

(*--- recorded
all:
  exit: 255
  transcript: 2213:1 TLC cannot handle the temporal formula line 19, col 9 to line 19, col 31 of module live_two_cycles__unfair__equivalence
---*)
