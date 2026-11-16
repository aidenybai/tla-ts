(*---
description: TLCGet("level") is 1 in an invariant of an initial state.
ref: tlc2/module/TLCGetSet.java#TLCGetStringValue
features:
  - TLC
flags:
  - expression
contexts:
  - invariant
outcome: success
---*)
---- MODULE level_invariant_initial ----
EXTENDS TLC, Naturals
Test == TLCGet("level") = 1
====

(*--- recorded
all:
  exit: 0
---*)
