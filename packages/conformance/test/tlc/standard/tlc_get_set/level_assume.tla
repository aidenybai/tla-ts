(*---
description: TLCGet("level") is 0 in ASSUME.
ref: tlc2/module/TLCGetSet.java#TLCGetStringValue
features:
  - TLC
flags:
  - expression
contexts:
  - assume
outcome: success
---*)
---- MODULE level_assume ----
EXTENDS TLC, Naturals
Test == TLCGet("level") = 0
====

(*--- recorded
all:
  exit: 0
---*)
