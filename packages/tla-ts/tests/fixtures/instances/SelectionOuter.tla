--------------------------- MODULE SelectionOuter ---------------------------
EXTENDS Naturals

VARIABLE z

O == INSTANCE Selection WITH y <- z

Init == z = 0

Next == z' = (z + 1) % 3

Spec == Init /\ [][Next]_z

Inv == O!Inv /\ O!G!Foo!:!y = 10 /\ O!G!Bar(3)!:!y(4) = 12 /\ O!G!Foo = z + 10
=============================================================================
