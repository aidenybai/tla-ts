---- MODULE EmptyReplies ----
EXTENDS Naturals, FiniteSets
VARIABLES reply
HasReply(entry) == Cardinality(DOMAIN entry) # 0
Init == reply = [peer \in 1..2 |-> <<>>]
Next ==
  \E peer \in 1..2 :
    \/ /\ HasReply(reply[peer])
       /\ reply[peer]["ok"] = FALSE
       /\ reply' = [reply EXCEPT ![peer] = <<>>]
    \/ /\ ~HasReply(reply[peer])
       /\ \E ok \in BOOLEAN : reply' = [reply EXCEPT ![peer] = [ok |-> ok, round |-> 1]]
    \/ /\ HasReply(reply[peer])
       /\ reply[peer].round < 3
       /\ reply[3 - peer] = <<>>
       /\ reply' = [reply EXCEPT ![peer].round = @ + 1]
====
