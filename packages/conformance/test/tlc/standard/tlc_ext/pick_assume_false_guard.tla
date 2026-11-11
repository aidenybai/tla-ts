(*---
description: In ASSUME, a FALSE guard is TRUE too, since s1 is the empty state, as TLCExt.tla promises for a constant-level formula.
ref: tlc2/module/TLCExt.java#pickSuccessor
features:
  - TLCExt
flags:
  - expression
contexts:
  - assume
outcome: success
---*)
---- MODULE pick_assume_false_guard ----
EXTENDS TLCExt, TLC, Naturals
Test == PickSuccessor(FALSE)
====

(*--- recorded
all:
  exit: 0
---*)
