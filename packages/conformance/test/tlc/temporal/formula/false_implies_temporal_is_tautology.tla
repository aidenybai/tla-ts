(*---
description: 'FALSE => <>P has the negated formula simplify to FALSE.'
ref: tlc2/tool/liveness/Liveness.java#astToLiveAppl
features: [liveness]
outcome: evaluation-failure
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE false_implies_temporal_is_tautology ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Prop == FALSE => <>(x = 99)
====

(*--- recorded
all:
  exit: 77
  transcript: 2253:1 Temporal formula is a tautology (its negation is unsatisfiable).
---*)
