---- MODULE PrintedConstants ----
EXTENDS Naturals, TLC
VARIABLE x
Hello == PrintT("hello")
Unused == PrintT("unused")
Init == x = 0
Next == Hello /\ x < 3 /\ x' = x + 1
====
