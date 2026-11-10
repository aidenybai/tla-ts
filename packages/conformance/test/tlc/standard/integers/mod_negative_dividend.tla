(*---
description: "% is non-negative for a negative dividend."
ref: tlc2/module/Integers.java#Mod
features:
  - Integers
flags:
  - expression
outcome: success
---*)
---- MODULE mod_negative_dividend ----
EXTENDS Integers
Test == -1 % 5 = 4 /\ -5 % 5 = 0 /\ -7 % 3 = 2
====

(*--- recorded
all:
  exit: 0
---*)
