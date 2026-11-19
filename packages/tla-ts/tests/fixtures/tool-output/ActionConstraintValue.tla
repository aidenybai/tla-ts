------------------------ MODULE ActionConstraintValue ------------------------
EXTENDS Naturals

VARIABLE x

Init == x = 0

Next == x < 2 /\ x' = x + 1

Act == IF x' = 1 THEN 0 ELSE TRUE
=============================================================================
