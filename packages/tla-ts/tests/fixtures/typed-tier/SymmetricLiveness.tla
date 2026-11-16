---- MODULE SymmetricLiveness ----
EXTENDS Naturals, TLC
CONSTANTS Procs
VARIABLES pc, owners
vars == <<pc, owners>>
Init == pc = [p \in Procs |-> 0] /\ owners = {}
Step(p) == pc[p] < 2 /\ pc' = [pc EXCEPT ![p] = pc[p] + 1] /\ owners' = owners \cup {p}
Release(p) == pc[p] = 2 /\ p \in owners /\ owners' = owners \ {p} /\ UNCHANGED pc
Next == \E p \in Procs : Step(p) \/ Release(p)
Spec == Init /\ [][Next]_vars /\ \A p \in Procs : WF_vars(Step(p) \/ Release(p))
Done == <>[](\A p \in Procs : pc[p] = 2)
Released == []<>(owners = {})
Busy == []<>(owners # {})
Symmetry == Permutations(Procs)
====
