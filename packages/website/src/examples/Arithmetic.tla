---- MODULE Arithmetic ----
EXTENDS Naturals, TLAPS

THEOREM \A n \in Nat : n + n = 2 * n
  BY SMT
====
