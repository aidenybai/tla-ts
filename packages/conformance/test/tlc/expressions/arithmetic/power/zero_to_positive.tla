(*---
description: "0^n is 0 for positive n."
ref: "tlc2/module/Naturals.java#Expt"
flags: [expression]
outcome: success
---*)
---- MODULE zero_to_positive ----
EXTENDS Integers
Test == 0 ^ 1 = 0 /\ 0 ^ 7 = 0
====

(*--- recorded
all:
  exit: 0
---*)
