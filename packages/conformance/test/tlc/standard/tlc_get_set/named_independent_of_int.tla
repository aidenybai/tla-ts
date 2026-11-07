(*---
description: Named and integer registers do not share storage.
ref: tlc2/module/TLCGetSet.java#TLCGetStringValue
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE named_independent_of_int ----
EXTENDS TLC, Naturals
Test == TLCSet(1, "i") /\ TLCSet("s:1", "s") /\ TLCGet(1) = "i" /\ TLCGet("s:1") = "s"
====

(*--- recorded
all:
  exit: 0
---*)
