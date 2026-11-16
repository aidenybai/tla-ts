(*---
description: "% gives the remainder."
ref: tlc2/module/Naturals.java#Mod
features:
  - Naturals
flags:
  - expression
outcome: success
---*)
---- MODULE mod_small ----
EXTENDS Naturals
Test == 7 % 3 = 1 /\ 6 % 3 = 0 /\ 2 % 3 = 2
====

(*--- recorded
all:
  exit: 0
---*)
