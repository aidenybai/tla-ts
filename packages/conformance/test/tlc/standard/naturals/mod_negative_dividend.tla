(*---
description: "% is non-negative for a negative dividend."
ref: tlc2/module/Naturals.java#Mod
features:
  - Naturals
flags:
  - expression
outcome: success
---*)
---- MODULE mod_negative_dividend ----
EXTENDS Naturals
Test == (0 - 7) % 3 = 2 /\ (0 - 6) % 3 = 0 /\ (0 - 1) % 5 = 4
====

(*--- recorded
all:
  exit: 0
---*)
