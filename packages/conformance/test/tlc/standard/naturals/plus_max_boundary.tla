(*---
description: The largest sum that fits in 32 bits does not overflow.
ref: tlc2/module/Naturals.java#Plus
features:
  - Naturals
flags:
  - expression
outcome: success
---*)
---- MODULE plus_max_boundary ----
EXTENDS Naturals
Test == 2147483646 + 1 = 2147483647
====

(*--- recorded
all:
  exit: 0
---*)
