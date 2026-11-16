(*---
description: '32 SF conjuncts cross-multiply past Integer.MAX_VALUE in toDNF, raising TLC_LIVE_CANNOT_HANDLE_FORMULA with its ''maximum supported size'' reason.'
ref: tlc2/tool/liveness/LNConj.java#toDNF
features: [liveness]
outcome: tlc-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE too_many_strong_conjuncts_overflow ----
EXTENDS Naturals
VARIABLE pc
S == {1, 2}
Step(p) == pc[p] = 0 /\ pc' = [pc EXCEPT ![p] = 1]
Next == \E p \in S : Step(p)
Init == pc = [p \in S |-> 0]
Prop == <>(\A p \in S : pc[p] = 1)

Spec == Init /\ [][Next]_pc /\ \A p \in 1..32 : SF_pc(p = 0 /\ Next)
====

(*--- recorded
all:
  exit: 255
  transcript: 2213:1 TLC cannot handle the temporal formula because it exceeds the maximum supported size in disjunctive normal form.
---*)
