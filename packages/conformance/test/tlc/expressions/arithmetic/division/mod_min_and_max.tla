(*---
description: "% is right at the integer limits."
ref: "tlc2/module/Naturals.java#Mod"
flags: [expression]
outcome: success
---*)
---- MODULE mod_min_and_max ----
EXTENDS Integers
Test == (-2147483647 - 1) % 2 = 0 /\ 2147483647 % 2147483647 = 0 /\ (-2147483647 - 1) % 2147483647 = 2147483646
====

(*--- recorded
all:
  exit: 0
---*)
