------------------------------ MODULE Queue ------------------------------
EXTENDS Naturals, Sequences

CONSTANTS Items, Capacity

VARIABLES queue, received

vars == <<queue, received>>

TypeOK == /\ queue \in Seq(Items)
          /\ Len(queue) <= Capacity
          /\ received \in Seq(Items)

Init == /\ queue = <<>>
        /\ received = <<>>

Produce(item) == /\ Len(queue) < Capacity
                 /\ queue' = Append(queue, item)
                 /\ UNCHANGED received

Consume == /\ queue # <<>>
           /\ received' = Append(received, Head(queue))
           /\ queue' = Tail(queue)

Next == (\E item \in Items : Produce(item)) \/ Consume

Spec == Init /\ [][Next]_vars

ReceivedIsBounded == Len(received) <= 5

ReceivedIsShort == Len(received) < 3
=============================================================================
