(*---
description: A negative base alternates sign.
ref: tlc2/module/Naturals.java#Expt
features:
  - Naturals
flags:
  - expression
outcome: success
---*)
---- MODULE expt_negative_base ----
EXTENDS Naturals
Test == (0 - 2) ^ 3 = 0 - 8 /\ (0 - 2) ^ 4 = 16 /\ (0 - 1) ^ 5 = 0 - 1
====

(*--- recorded
all:
  exit: 0
---*)
