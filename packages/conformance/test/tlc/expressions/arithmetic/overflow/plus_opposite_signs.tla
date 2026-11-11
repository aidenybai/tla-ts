(*---
description: "Adding opposite signs at the limits cannot overflow."
ref: "tlc2/module/Naturals.java#Plus"
flags: [expression]
outcome: success
---*)
---- MODULE plus_opposite_signs ----
EXTENDS Integers
Test == (-2147483647 - 1) + 2147483647 = -1
====

(*--- recorded
all:
  exit: 0
---*)
