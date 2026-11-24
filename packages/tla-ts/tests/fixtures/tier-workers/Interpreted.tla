---- MODULE Interpreted ----
EXTENDS Naturals
VARIABLE x
Init == x = 1
Next == x < 512 /\ x' \in {2 * x, 2 * x + 1}
Kept == x' % 3 # 0
====
