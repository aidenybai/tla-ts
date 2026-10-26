----------------------------- MODULE Operators -----------------------------
EXTENDS Naturals

VARIABLES sum, product

item == 3

Sum == INSTANCE Folding WITH Combine <- LAMBDA a, b : (a + b + item) % 7, total <- sum

Product == INSTANCE Folding WITH Combine <- LAMBDA a, b : (a * b) % 5, total <- product

Init == sum = 0 /\ product = 1

Next == \/ Sum!Step /\ UNCHANGED product
        \/ Product!Step /\ UNCHANGED sum

Spec == Init /\ [][Next]_<<sum, product>>

Small == sum + product < 9
=============================================================================
