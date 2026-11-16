(*---
description: An unevaluated Assert does not fire.
ref: tlc2/module/TLC.java#Assert
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE assert_in_short_circuit ----
EXTENDS TLC, Naturals
Test == TRUE \/ Assert(FALSE, "unused")
====

(*--- recorded
all:
  exit: 0
---*)
