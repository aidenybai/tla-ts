(*---
description: "Comparisons work at the integer limits."
ref: "tlc2/module/Integers.java#LT"
flags: [expression]
outcome: success
---*)
---- MODULE limits_compare ----
EXTENDS Integers
Test == (-2147483647 - 1) < 2147483647 /\ 2147483647 > (-2147483647 - 1)
====

(*--- recorded
all:
  exit: 0
---*)
