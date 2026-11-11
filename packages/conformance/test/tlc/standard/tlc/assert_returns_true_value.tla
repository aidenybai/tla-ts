(*---
description: Assert returns its first argument.
ref: tlc2/module/TLC.java#Assert
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE assert_returns_true_value ----
EXTENDS TLC, Naturals
Test == Assert(1 = 1, "m") = TRUE
====

(*--- recorded
all:
  exit: 0
---*)
