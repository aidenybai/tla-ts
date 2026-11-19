---- MODULE UserFilePossible ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
Seen == x = 2 /\ x' = 0
Unseen == x = 2 /\ x' = 1
====
