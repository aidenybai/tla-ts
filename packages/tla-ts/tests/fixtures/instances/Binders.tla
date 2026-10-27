------------------------------ MODULE Binders ------------------------------
EXTENDS Naturals

VARIABLE y

P(i) == INSTANCE BindersInner WITH c <- i, x <- y, Combine <- LAMBDA a, b : a + b + i

G == INSTANCE BindersInner WITH c <- 2, x <- y, Combine <- LAMBDA a, b : a * b

Init == y = 0

Next == y' = (y + 1) % 3

Spec == Init /\ [][Next]_y

Bound ==
  /\ G!Near = (y + 2 <= 5)
  /\ G!Named = G!Combined
  /\ \A i \in 1..2 : P(i)!Named = P(i)!Combined

Captured == G!Near => y = 0
=============================================================================
