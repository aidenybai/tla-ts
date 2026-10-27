------------------------------ MODULE Overrides ------------------------------
EXTENDS Integers
Flag == FALSE
Small == 0
Large == 0
Name == "tla"
Twice(n) == 2 * n
Mismatch == TRUE
ASSUME Flag /\ Small = 3 /\ Large = 100000 /\ Name = "java"
ASSUME Twice(5) = -2 /\ Mismatch
=============================================================================
