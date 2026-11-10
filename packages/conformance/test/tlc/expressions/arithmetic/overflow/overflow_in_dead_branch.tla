(*---
description: "Overflow arises only in evaluated operations."
ref: "tlc2/module/Naturals.java#Plus"
flags: [expression]
outcome: success
---*)
---- MODULE overflow_in_dead_branch ----
EXTENDS Integers
Test == IF FALSE THEN 2147483647 + 1 = 0 ELSE TRUE
====

(*--- recorded
all:
  exit: 0
---*)
