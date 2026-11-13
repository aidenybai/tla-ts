---- MODULE NullableRecords ----
EXTENDS Naturals
CONSTANT NIL
VARIABLES leader, seen
Init == leader = NIL /\ seen = {NIL}
Elect ==
  /\ leader = NIL
  /\ \E t \in 1..2 : leader' = [term |-> t, votes |-> 0]
  /\ seen' = seen \cup {leader'}
Vote ==
  /\ leader # NIL
  /\ leader.votes < 2
  /\ leader' = [leader EXCEPT !.votes = @ + 1]
  /\ seen' = seen \cup {leader'}
Resign == leader # NIL /\ leader' = NIL /\ UNCHANGED seen
Next == Elect \/ Vote \/ Resign
Term == IF leader = NIL THEN 0 ELSE leader.term
TypeOK ==
  /\ leader \in {NIL} \cup [term : 1..2, votes : 0..2]
  /\ \A s \in seen : s = NIL \/ s.term >= 1
  /\ leader = NIL \/ "votes" \in DOMAIN leader
====
