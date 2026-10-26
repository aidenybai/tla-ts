----------------------------- MODULE Instances -----------------------------
EXTENDS Naturals

VARIABLES left, right, shared

Values == 0..2

Left == INSTANCE Channel WITH Data <- Values, channel <- left

Right == INSTANCE Channel WITH Data <- Values, channel <- right

Pair(target) == INSTANCE Channel WITH Data <- Values, channel <- target

INSTANCE Channel WITH Data <- Values, channel <- shared

Init == left = 0 /\ right = 0 /\ shared = 0

Next == \/ /\ \E item \in Values : Left!Send(item)
           /\ Right!Idle
           /\ Idle
        \/ /\ \E item \in Values : Right!Send(item)
           /\ UNCHANGED <<left, shared>>
        \/ /\ \E item \in Values : Send(item)
           /\ UNCHANGED <<left, right>>

Spec == Init /\ [][Next]_<<left, right, shared>>

Safe == Left!TypeOK /\ Pair(right)!TypeOK /\ TypeOK

Different == left + right + shared < 6
=============================================================================
