(*---
description: Checks quantified_empty on the two_cycles machine under weak fairness.
ref: tlc2/tool/liveness/LiveCheck.java; tlc2/tool/liveness/Liveness.java
features:
  - liveness
outcome: any
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE live_two_cycles__weak__quantified_empty ----
EXTENDS Integers
VARIABLE x
Next == \/ x \in {0, 1} /\ x' = 1 - x
        \/ x = 1 /\ x' = 2
        \/ x = 2 /\ x' = 2
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Prop == \A v \in {} : <>(x = v)
====

(*--- recorded
all:
  exit: 77
  transcript: 2253:1 Temporal formula is a tautology (its negation is unsatisfiable).
---*)
