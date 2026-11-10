(*---
description: Assert with TRUE returns TRUE and does not print its message.
ref: tlc2/module/TLC.java#Assert
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE assert_true ----
EXTENDS TLC, Naturals
Test == Assert(TRUE, "unused")
====

(*--- recorded
all:
  exit: 0
---*)
