(*---
description: "x = y * (x \\div y) + (x % y) for positive y across negatives."
ref: "tlc2/module/Integers.java#Mod"
flags: [expression]
outcome: success
---*)
---- MODULE div_and_mod_agree ----
EXTENDS Integers
Test == \A x \in -5..5, y \in 1..3 : x = y * (x \div y) + (x % y)
====

(*--- recorded
all:
  exit: 0
---*)
