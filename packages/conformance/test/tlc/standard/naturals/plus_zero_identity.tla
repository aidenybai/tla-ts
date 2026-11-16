(*---
description: Adding 0 leaves the other operand unchanged.
ref: tlc2/module/Naturals.java#Plus
features:
  - Naturals
flags:
  - expression
outcome: success
---*)
---- MODULE plus_zero_identity ----
EXTENDS Naturals
Test == 0 + 7 = 7 /\ 7 + 0 = 7 /\ 0 + 0 = 0
====

(*--- recorded
all:
  exit: 0
---*)
