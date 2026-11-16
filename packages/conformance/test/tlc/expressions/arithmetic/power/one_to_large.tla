(*---
description: "1^n computes by a loop with no overflow."
ref: "tlc2/module/Naturals.java#Expt"
flags: [expression]
outcome: success
---*)
---- MODULE one_to_large ----
EXTENDS Integers
Test == 1 ^ 1000 = 1 /\ (-1) ^ 1001 = -1 /\ (-1) ^ 1000 = 1
====

(*--- recorded
all:
  exit: 0
---*)
