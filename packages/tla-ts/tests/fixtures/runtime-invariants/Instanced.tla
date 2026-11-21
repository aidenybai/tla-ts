---- MODULE Instanced ----
EXTENDS Naturals, TLC
CONSTANT N
ASSUME PrintT("assumed")
Positive == N > 0
====
