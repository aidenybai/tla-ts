(*---
description: TLCGet("level") is 0 in the initial predicate.
ref: tlc2/module/TLCGetSet.java#TLCGetStringValue
features:
  - TLC
flags:
  - expression
contexts:
  - init
outcome: success
---*)
---- MODULE level_init ----
EXTENDS TLC, Naturals
Test == TLCGet("level") = 0
====

(*--- recorded
all:
  exit: 0
---*)
