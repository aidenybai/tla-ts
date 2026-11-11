(*---
description: Operands of opposite sign cannot overflow, even at the extremes.
ref: tlc2/module/Naturals.java#Plus
features:
  - Naturals
flags:
  - expression
outcome: success
---*)
---- MODULE plus_mixed_signs_never_overflow ----
EXTENDS Naturals
Test == 2147483647 + (0 - 2147483647 - 1) = 0 - 1
====

(*--- recorded
all:
  exit: 0
---*)
