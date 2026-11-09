---- MODULE RecordBags ----
EXTENDS Naturals, TLC
VARIABLES messages
Kinds == 1..2
Init == messages = [m \in {} |-> 0]
Send(m) ==
  /\ m \notin DOMAIN messages
  /\ messages' = messages @@ (m :> 1)
Duplicate(m) ==
  /\ m \in DOMAIN messages
  /\ messages[m] < 2 + m.kind
  /\ messages' = [messages EXCEPT ![m] = @ + 1]
Next == \E kind \in Kinds : Send([kind |-> kind]) \/ Duplicate([kind |-> kind])
====
