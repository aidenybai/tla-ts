(*---
description: \leq is true on equal operands.
ref: tlc2/module/Naturals.java#LE
features:
  - Naturals
flags:
  - expression
outcome: success
---*)
---- MODULE le_values ----
EXTENDS Naturals
Test == 1 \leq 2 /\ 2 \leq 2 /\ ~(3 \leq 2)
====

(*--- recorded
all:
  exit: 0
---*)
