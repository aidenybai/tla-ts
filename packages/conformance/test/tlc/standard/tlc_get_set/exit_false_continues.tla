(*---
description: TLCSet("exit", FALSE) returns TRUE and does nothing.
ref: tlc2/module/TLCGetSet.java#TLCSet
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE exit_false_continues ----
EXTENDS TLC, Naturals
Test == TLCSet("exit", FALSE)
====

(*--- recorded
all:
  exit: 0
---*)
