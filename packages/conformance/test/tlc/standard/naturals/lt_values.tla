(*---
description: < compares integers.
ref: tlc2/module/Naturals.java#LT
features:
  - Naturals
flags:
  - expression
outcome: success
---*)
---- MODULE lt_values ----
EXTENDS Naturals
Test == 1 < 2 /\ ~(2 < 2) /\ ~(3 < 2) /\ (0 - 1) < 0
====

(*--- recorded
all:
  exit: 0
---*)
