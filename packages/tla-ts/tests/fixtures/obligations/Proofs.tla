---- MODULE Proofs ----
EXTENDS Naturals
CONSTANT N
ASSUME NType == N \in Nat

THEOREM Positive == N + 1 > 0
  BY NType

THEOREM Double == \A x \in Nat : x + x = 2 * x
<1> TAKE x \in Nat
<1> QED OBVIOUS
====
