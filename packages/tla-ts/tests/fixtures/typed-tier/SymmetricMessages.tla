---- MODULE SymmetricMessages ----
EXTENDS RecursiveMessages, TLC
Symmetry == Permutations(Server)
View == <<msgs, pending, count>>
====
