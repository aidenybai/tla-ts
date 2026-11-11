(*---
description: '\E over an empty set translates to FALSE. The formula being checked simplifies to FALSE, processLiveness returns no solutions, and TLC fails with TLC_LIVE_FORMULA_TAUTOLOGY.'
ref: tlc2/tool/liveness/Liveness.java#astToLiveAppl
features: [liveness]
outcome: evaluation-failure
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE exists_empty_is_false ----
EXTENDS Naturals
VARIABLE pc
S == {1, 2}
Step(p) == pc[p] = 0 /\ pc' = [pc EXCEPT ![p] = 1]
Next == \E p \in S : Step(p)
Init == pc = [p \in S |-> 0]
Prop == <>(\A p \in S : pc[p] = 1)

Spec == Init /\ [][Next]_pc /\ \E p \in {} : WF_pc(Step(p))
====

(*--- recorded
all:
  exit: 77
  transcript: 2253:1 Temporal formula is a tautology (its negation is unsatisfiable).
---*)
