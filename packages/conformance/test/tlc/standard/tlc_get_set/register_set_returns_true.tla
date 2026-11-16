(*---
description: TLCSet returns TRUE.
ref: tlc2/module/TLCGetSet.java#TLCSet
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE register_set_returns_true ----
EXTENDS TLC, Naturals
Test == TLCSet(1, 7) = TRUE
====

(*--- recorded
all:
  exit: 0
---*)
