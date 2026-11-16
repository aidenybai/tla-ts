---- MODULE FilteredMembership ----
EXTENDS Naturals, FiniteSets
VARIABLES voters, votes, elected
Quorum(set) == {q \in SUBSET set : Cardinality(q) * 2 > Cardinality(set)}
Init == voters = {1, 2, 3} /\ votes = {} /\ elected = FALSE
Vote ==
  \E v \in 1..4 :
    /\ v \notin votes
    /\ votes' = votes \cup {v}
    /\ UNCHANGED <<voters, elected>>
Grow ==
  \E v \in 4..5 :
    /\ v \notin voters
    /\ voters' = voters \cup {v}
    /\ UNCHANGED <<votes, elected>>
Elect ==
  /\ ~elected
  /\ votes \in Quorum(voters)
  /\ elected' = TRUE
  /\ UNCHANGED <<voters, votes>>
Next == Vote \/ Grow \/ Elect
====
