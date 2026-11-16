(*---
description: "Adding zero to the largest integer is not an overflow."
ref: "tlc2/module/Naturals.java#Plus"
flags: [expression]
outcome: success
---*)
---- MODULE plus_max ----
EXTENDS Integers
Test == 2147483647 + 0 = 2147483647
====

(*--- recorded
all:
  exit: 0
---*)
