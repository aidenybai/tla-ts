(*---
description: Checks quantified_empty on the many_starts machine under unfair fairness.
ref: tlc2/tool/liveness/LiveCheck.java; tlc2/tool/liveness/Liveness.java
features:
  - liveness
outcome: any
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE live_many_starts__unfair__quantified_empty ----
EXTENDS Integers
VARIABLE x
Next == x' = (x + 1) % 3
Spec == x \in 0..2 /\ [][Next]_x
Prop == \A v \in {} : <>(x = v)
====

(*--- recorded
all:
  exit: 77
  transcript: 2253:1 Temporal formula is a tautology (its negation is unsatisfiable).
---*)
