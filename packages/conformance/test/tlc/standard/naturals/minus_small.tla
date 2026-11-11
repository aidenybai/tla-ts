(*---
description: Minus subtracts.
ref: tlc2/module/Naturals.java#Minus
features:
  - Naturals
flags:
  - expression
outcome: success
---*)
---- MODULE minus_small ----
EXTENDS Naturals
Test == 5 - 3 = 2
====

(*--- recorded
all:
  exit: 0
---*)
