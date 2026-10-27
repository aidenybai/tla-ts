---- MODULE Warnings ----
EXTENDS Naturals
VARIABLE x
F(a) == a + 1
THEOREM F(1) = 2
  BY DEF F, Nat, x
THEOREM x = x
<1>1. x = x
  OBVIOUS
<1>2. QED
  <2>1. x = x
    OBVIOUS
  <2>2. QED
    BY <2>1, <1>2
====
