(*---
description: "% is non-negative for a negative dividend, unlike Java."
ref: "tlc2/module/Naturals.java#Mod"
flags: [expression]
outcome: success
---*)
---- MODULE mod_negative_dividend_non_negative ----
EXTENDS Integers
Test == -7 % 2 = 1 /\ -7 % 7 = 0 /\ -1 % 5 = 4
====

(*--- recorded
all:
  exit: 0
---*)
