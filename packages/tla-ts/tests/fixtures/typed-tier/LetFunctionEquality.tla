---- MODULE LetFunctionEquality ----
EXTENDS Naturals
VARIABLES x
Init == x = 0
Next == x < 2 /\ x' = x + 1
Spec == Init /\ [][Next]_x
Differ ==
  LET f[n \in 0..2] == n + x
      g[n \in 0..2] == x + n
  IN f # g
====
