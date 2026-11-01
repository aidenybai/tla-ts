---- MODULE Numbered ----
EXTENDS Naturals
CONSTANT N
RECURSIVE Sum(_)
Sum(n) == IF n = 0 THEN 0 ELSE n + Sum(n - 1)
Same == INSTANCE Counted WITH Limit <- N
Smile == "😀"
Empty == ""
THEOREM Bigger == ASSUME NEW k \in Nat PROVE Sum(k) >= k
<1>1. Sum(0) = 0
  OBVIOUS
<1>2. Sum(0) + 1 = 1
  BY <1>1
<1>3. @ = 1 + 0
  OBVIOUS
<1>4. QED
  BY <1>1, <1>2 DEF Sum
====
