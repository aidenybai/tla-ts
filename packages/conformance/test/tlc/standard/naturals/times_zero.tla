(*---
description: Multiplying the largest integer by 0 gives 0.
ref: tlc2/module/Naturals.java#Times
features:
  - Naturals
flags:
  - expression
outcome: success
---*)
---- MODULE times_zero ----
EXTENDS Naturals
Test == 0 * 2147483647 = 0 /\ 2147483647 * 0 = 0
====

(*--- recorded
all:
  exit: 0
---*)
