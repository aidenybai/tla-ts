(*---
description: "A sum that lands on the largest integer does not overflow."
ref: "tlc2/module/Naturals.java#Plus"
flags: [expression]
outcome: success
---*)
---- MODULE plus_reach_max ----
EXTENDS Integers
Test == 2147483646 + 1 = 2147483647
====

(*--- recorded
all:
  exit: 0
---*)
