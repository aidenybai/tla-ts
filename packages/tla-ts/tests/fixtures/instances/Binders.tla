------------------------------ MODULE Binders ------------------------------
EXTENDS Naturals

VARIABLE y

w == 1

P(i) == INSTANCE BindersInner WITH c <- i, x <- y, Combine <- LAMBDA a, b : a + b + i

G == INSTANCE BindersInner WITH c <- 2, x <- y, Combine <- LAMBDA a, b : a * b + w

Init == y = 0

Next == y' = (y + 1) % 3

Spec == Init /\ [][Next]_y

Parameterized ==
  \A i \in 1..2 :
    /\ P(i)!Shift = y + i
    /\ P(i)!Has(0..5) = (y + i <= 5)
    /\ P(i)!AllAbove(0..1) = (y + i > 1)
    /\ P(i)!Add(1) = y + i + 1
    /\ P(i)!Local = y + i + 10
    /\ P(i)!Picked = y + i
    /\ P(i)!Matching = {k \in 0..20 : k >= y + i}
    /\ P(i)!Doubled = {k * 2 : k \in 0..i}
    /\ P(i)!Table = [k \in 0..2 |-> k + i]
    /\ P(i)!f[3] = i + 3
    /\ P(i)!UsesLambda = i + y
    /\ P(i)!Combined = \E k \in 0..3 : k + y + i = i + 3
    /\ P(i)!Labeled
    /\ P(i)!Labeled!lab(y + i)
    /\ P(i)!Named = P(i)!Combined

InsideLet ==
  \A i \in 1..2 :
    LET I == INSTANCE BindersInner WITH c <- i, x <- y, Combine <- LAMBDA a, b : a + b + i
    IN  /\ I!Has(0..5) = (y + i <= 5)
        /\ I!Add(1) = y + i + 1
        /\ I!Local = y + i + 10
        /\ I!Combined = \E k \in 0..3 : k + y + i = i + 3

Global ==
  /\ G!Has(0..5) = (y + 2 <= 5)
  /\ G!Near = (y + 2 <= 5)
  /\ G!Plus(1) = y + 1
  /\ G!Offset = [k \in 0..2 |-> y + k]
  /\ G!Scaled = {k + w : k \in 0..2}
  /\ G!Combined = \E k \in 0..3 : k * y + w = 5
  /\ G!Named = G!Combined

Captured == G!Near => y = 0
=============================================================================
