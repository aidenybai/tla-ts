(*---
description: A large register index grows the worker's register array.
ref: tlc2/module/TLCGetSet.java#TLCGetEval
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE register_large_index ----
EXTENDS TLC, Naturals
Test == TLCSet(1000, 1) /\ TLCGet(1000) = 1
====

(*--- recorded
all:
  exit: 0
---*)
