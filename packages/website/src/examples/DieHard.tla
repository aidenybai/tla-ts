---- MODULE DieHard ----
EXTENDS Naturals
VARIABLES big, small

Init == big = 0 /\ small = 0

Min(m, n) == IF m < n THEN m ELSE n

FillSmall == small' = 3 /\ big' = big
FillBig == big' = 5 /\ small' = small
EmptySmall == small' = 0 /\ big' = big
EmptyBig == big' = 0 /\ small' = small
SmallToBig == big' = Min(big + small, 5) /\ small' = small - (big' - big)
BigToSmall == small' = Min(big + small, 3) /\ big' = big - (small' - small)

Next == FillSmall \/ FillBig \/ EmptySmall \/ EmptyBig \/ SmallToBig \/ BigToSmall

NotSolved == big # 4
====
