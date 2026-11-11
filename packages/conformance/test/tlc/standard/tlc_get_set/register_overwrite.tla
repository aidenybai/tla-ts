(*---
description: A later set replaces the value.
ref: tlc2/module/TLCGetSet.java#TLCGetEval
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE register_overwrite ----
EXTENDS TLC, Naturals
Test == TLCSet(2, 1) /\ TLCSet(2, 2) /\ TLCGet(2) = 2
====

(*--- recorded
all:
  exit: 0
---*)
