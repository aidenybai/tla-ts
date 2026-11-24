---- MODULE NoVariables ----
EXTENDS Naturals, TLC
CONSTANT N
ASSUME PrintT(<<"assume", N + 1>>)
====
