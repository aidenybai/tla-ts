(*---
description: 'BUG: a constant base case of a temporal RECURSIVE operator is rebuilt by astToLive(expr, con, 0), whose getLevelBound on the call returns the temporal level, so it falls to new LNAction(Reach(0)) and classifyExpr rejects a formula with no action in it.'
ref: tlc2/tool/liveness/Liveness.java#astToLive
features: [liveness, tlc-bug]
outcome: tlc-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE recursive_temporal_with_conj ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
RECURSIVE Reach(_)
Reach(n) == IF n = 0 THEN TRUE ELSE <>(x = n) /\ Reach(n - 1)
Prop == Reach(2)
====

(*--- recorded
all:
  exit: 255
  transcript: 2214:1 Temporal formulas containing actions must be of forms <>[]A or []<>A.
---*)
