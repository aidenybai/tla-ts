(*---
description: 0 % n is 0.
ref: tlc2/module/Naturals.java#Mod
features:
  - Naturals
flags:
  - expression
outcome: success
---*)
---- MODULE mod_zero_dividend ----
EXTENDS Naturals
Test == 0 % 3 = 0
====

(*--- recorded
all:
  exit: 0
---*)
