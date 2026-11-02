---- MODULE Mistake ----
EXTENDS Naturals, TLAPS

THEOREM \A n \in Nat : n * n > n
  BY SMT
====
