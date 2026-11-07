(*---
description: 'A quantifier over an infinite set fails in contexts, with the cause attached.'
ref: tlc2/tool/liveness/Liveness.java#astToLiveAppl
features: [liveness]
outcome: tlc-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE forall_of_non_enumerable_set ----
EXTENDS Naturals
VARIABLE pc
S == {1, 2}
Step(p) == pc[p] = 0 /\ pc' = [pc EXCEPT ![p] = 1]
Next == \E p \in S : Step(p)
Init == pc = [p \in S |-> 0]
Prop == <>(\A p \in S : pc[p] = 1)

Spec == Init /\ [][Next]_pc /\ \A p \in Nat : WF_pc(Step(p))
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    2213:1 TLC cannot handle the temporal formula line 20, col 32 to line 20, col 60 of module forall_of_non_enumerable_set:
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 20, col 41 to line 20, col 43 of module forall_of_non_enumerable_set
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)
