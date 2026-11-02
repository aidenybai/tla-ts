---- MODULE Invariant ----
EXTENDS Naturals, TLAPS
VARIABLE count

Init == count = 0
Next == count' = count + 1
Spec == Init /\ [][Next]_count

TypeOK == count \in Nat

THEOREM Spec => []TypeOK
<1>1. Init => TypeOK
  BY DEF Init, TypeOK
<1>2. TypeOK /\ [Next]_count => TypeOK'
  BY DEF TypeOK, Next
<1>3. QED
  BY <1>1, <1>2, PTL DEF Spec
====
