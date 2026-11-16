(*---
description: "2^30 fits."
ref: "tlc2/module/Naturals.java#Expt"
flags: [expression]
outcome: success
---*)
---- MODULE two_to_30 ----
EXTENDS Integers
Test == 2 ^ 30 = 1073741824
====

(*--- recorded
all:
  exit: 0
---*)
