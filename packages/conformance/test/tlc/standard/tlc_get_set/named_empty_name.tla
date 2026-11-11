(*---
description: The bare prefix is a valid name.
ref: tlc2/module/TLCGetSet.java#TLCGetStringValue
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE named_empty_name ----
EXTENDS TLC, Naturals
Test == TLCSet("s:", 1) /\ TLCGet("s:") = 1
====

(*--- recorded
all:
  exit: 0
---*)
