(*---
description: A value set in a register is read back.
ref: tlc2/module/TLCGetSet.java#TLCGetEval
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE register_set_then_get ----
EXTENDS TLC, Naturals
Test == TLCSet(1, 7) /\ TLCGet(1) = 7
====

(*--- recorded
all:
  exit: 0
---*)
