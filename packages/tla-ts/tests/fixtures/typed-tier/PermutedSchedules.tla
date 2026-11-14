---- MODULE PermutedSchedules ----
EXTENDS Naturals, Sequences
VARIABLES pending, sched
PermSeqs(S) ==
  LET perms[ss \in SUBSET S] ==
        IF ss = {} THEN { << >> }
        ELSE LET ps == [x \in ss |-> { Append(sq, x) : sq \in perms[ss \ {x}] }]
             IN UNION { ps[x] : x \in ss }
  IN perms[S]
Init == pending = {1, 2, 3} /\ sched = << >>
Next ==
  \/ \E S \in SUBSET pending :
       /\ S # {}
       /\ \E sq \in PermSeqs(S) : sched' = sched \o sq
       /\ pending' = pending \ S
  \/ /\ sched # << >>
     /\ sched' = Tail(sched)
     /\ UNCHANGED pending
Spec == Init /\ [][Next]_<<pending, sched>>
====
