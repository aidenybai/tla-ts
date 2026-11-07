(*---
description: A named register can be replaced.
ref: tlc2/module/TLCGetSet.java#TLCGetStringValue
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE named_overwrite ----
EXTENDS TLC, Naturals
Test == TLCSet("s:b", 1) /\ TLCSet("s:b", "x") /\ TLCGet("s:b") = "x"
====

(*--- recorded
all:
  exit: 0
---*)
