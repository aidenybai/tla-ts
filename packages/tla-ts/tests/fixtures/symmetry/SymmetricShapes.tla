---- MODULE SymmetricShapes ----
EXTENDS Naturals, Sequences, TLC
CONSTANTS Proc, Item
VARIABLES owner, groups, messages, log
vars == <<owner, groups, messages, log>>
Init ==
  /\ owner = [p \in Proc |-> {}]
  /\ groups = {}
  /\ messages = {}
  /\ log = << >>
Take == \E p \in Proc, i \in Item :
  /\ i \notin owner[p]
  /\ owner' = [owner EXCEPT ![p] = @ \cup {i}]
  /\ UNCHANGED <<groups, messages, log>>
Pair == \E p \in Proc, i \in Item :
  /\ groups' = groups \cup {{p, i}, {p}}
  /\ UNCHANGED <<owner, messages, log>>
Send == \E p \in Proc, i \in Item :
  /\ messages' = messages \cup {[who |-> p], [who |-> p, what |-> i], [to |-> {p}, seen |-> TRUE]}
  /\ UNCHANGED <<owner, groups, log>>
Note == \E p \in Proc :
  /\ Len(log) < 2
  /\ log' = Append(log, <<p, log = << >>, "note", [q \in Proc |-> q = p]>>)
  /\ UNCHANGED <<owner, groups, messages>>
Next == Take \/ Pair \/ Send \/ Note
Spec == Init /\ [][Next]_vars
Symmetric == Permutations(Proc) \cup Permutations(Item)
====
