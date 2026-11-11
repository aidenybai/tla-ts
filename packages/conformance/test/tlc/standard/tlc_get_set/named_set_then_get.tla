(*---
description: "A key with the s: prefix is a named register."
ref: tlc2/module/TLCGetSet.java#TLCGetStringValue
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE named_set_then_get ----
EXTENDS TLC, Naturals
Test == TLCSet("s:a", 1) /\ TLCGet("s:a") = 1
====

(*--- recorded
all:
  exit: 0
---*)
