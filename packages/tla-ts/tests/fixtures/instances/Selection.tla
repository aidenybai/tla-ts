------------------------------ MODULE Selection ------------------------------
EXTENDS Naturals

VARIABLE y

G == INSTANCE SelectionInner WITH x <- y

Init == y = 0

Next == y' = (y + 1) % 3

Spec == Init /\ [][Next]_y

Inv ==
  /\ G!Foo = y + 10
  /\ G!Foo!:!y = 10
  /\ G!Bar(3) = y + 6
  /\ G!Bar(3)!:!y(4) = 12
=============================================================================
