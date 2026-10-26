------------------------------ MODULE Scoping ------------------------------
EXTENDS Naturals, ScopingSibling, ScopingHidden

VARIABLE x

Scale(n) == n * 100

Shared == INSTANCE ScopingLibrary

INSTANCE ScopingLibrary

Bounded == INSTANCE ScopingCounter WITH Limit <- 3, count <- x

MCBase == 1

Init == x = 0

Next == x < 3 /\ Bounded!Step

Sibling == Increment(1) = 2 /\ Hundred = 100

OwnScope == Scale(1) = 100

Override == Shared!Total = 2 /\ Total = 2 /\ Shared!Base = 7

Recursive == Bounded!Sum(3) = 6 /\ Bounded!Table[2] = 3
=============================================================================
