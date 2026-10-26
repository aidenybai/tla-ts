---- MODULE Counters ----
EXTENDS Naturals
VARIABLES a, b
A == INSTANCE Counter WITH Max <- 3, count <- a
B == INSTANCE Counter WITH Max <- 4, count <- b
Init == A!Init /\ B!Init
Next == (A!Next /\ UNCHANGED b) \/ (B!Next /\ UNCHANGED a)
Inv == a + b < 7
====
