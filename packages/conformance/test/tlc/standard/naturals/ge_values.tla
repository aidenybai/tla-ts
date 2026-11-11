(*---
description: \geq is true on equal operands.
ref: tlc2/module/Naturals.java#GEQ
features:
  - Naturals
flags:
  - expression
outcome: success
---*)
---- MODULE ge_values ----
EXTENDS Naturals
Test == 2 \geq 1 /\ 2 \geq 2 /\ ~(1 \geq 2)
====

(*--- recorded
all:
  exit: 0
---*)
