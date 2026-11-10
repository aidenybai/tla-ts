(*---
description: Different registers hold different values.
ref: tlc2/module/TLCGetSet.java#TLCGetEval
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE registers_independent ----
EXTENDS TLC, Naturals
Test == TLCSet(1, "a") /\ TLCSet(2, "b") /\ TLCGet(1) = "a" /\ TLCGet(2) = "b"
====

(*--- recorded
all:
  exit: 0
---*)
