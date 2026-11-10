(*---
description: "x^0 is 1 for non-zero x, including negatives."
ref: "tlc2/module/Naturals.java#Expt"
flags: [expression]
outcome: success
---*)
---- MODULE nonzero_to_zero ----
EXTENDS Integers
Test == 5 ^ 0 = 1 /\ (-5) ^ 0 = 1
====

(*--- recorded
all:
  exit: 0
---*)
