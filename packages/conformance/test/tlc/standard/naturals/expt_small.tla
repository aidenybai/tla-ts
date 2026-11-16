(*---
description: ^ raises to a power.
ref: tlc2/module/Naturals.java#Expt
features:
  - Naturals
flags:
  - expression
outcome: success
---*)
---- MODULE expt_small ----
EXTENDS Naturals
Test == 2 ^ 10 = 1024 /\ 3 ^ 2 = 9
====

(*--- recorded
all:
  exit: 0
---*)
