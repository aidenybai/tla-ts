(*---
description: '<>[]TRUE => TRUE simplifies to a top-level Boolean: processLiveness returns no orders of solution, so TLC fails with TLC_LIVE_FORMULA_TAUTOLOGY.'
ref: tlc2/tool/ModelChecker.java#modelCheckImpl
features: [liveness]
outcome: evaluation-failure
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE eventually_always_true_implies_true ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Prop == <>[]TRUE => TRUE
====

(*--- recorded
all:
  exit: 77
  transcript: 2253:1 Temporal formula is a tautology (its negation is unsatisfiable).
---*)
