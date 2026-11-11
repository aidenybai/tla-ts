(*---
description: The smallest sum that fits in 32 bits does not overflow.
ref: tlc2/module/Naturals.java#Plus
features:
  - Naturals
flags:
  - expression
outcome: success
---*)
---- MODULE plus_min_boundary ----
EXTENDS Naturals
Test == (0 - 2147483647) + (0 - 1) = (0 - 2147483647 - 1)
====

(*--- recorded
all:
  exit: 0
---*)
