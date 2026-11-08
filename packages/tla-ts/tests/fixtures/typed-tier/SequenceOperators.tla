---- MODULE SequenceOperators ----
EXTENDS Naturals, Sequences
CONSTANTS P
VARIABLES owner, log
Holds(s, Test(_)) == \A i \in DOMAIN s : Test(s[i])
Init == owner \in P /\ log = <<>>
Next ==
  LET recent == SubSeq(log, 2, Len(log))
      missing == log[Len(log) + 1]
  IN \E p \in P :
       /\ p # owner
       /\ Len(log) < 4
       /\ Holds(recent, LAMBDA q : q # p)
       /\ owner' = p
       /\ log' = Append(SelectSeq(log, LAMBDA q : q # owner), p)
====
