(*---
description: In ASSUME, s1 is the empty state with no variables, so a TRUE guard is TRUE.
ref: tlc2/module/TLCExt.java#pickSuccessor
features:
  - TLCExt
flags:
  - expression
contexts:
  - assume
outcome: success
---*)
---- MODULE pick_assume ----
EXTENDS TLCExt, TLC, Naturals
Test == PickSuccessor(TRUE)
====

(*--- recorded
all:
  exit: 0
---*)
