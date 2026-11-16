(*---
description: Register 0 is valid.
ref: tlc2/module/TLCGetSet.java#TLCGetEval
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE register_zero ----
EXTENDS TLC, Naturals
Test == TLCSet(0, "z") /\ TLCGet(0) = "z"
====

(*--- recorded
all:
  exit: 0
---*)
