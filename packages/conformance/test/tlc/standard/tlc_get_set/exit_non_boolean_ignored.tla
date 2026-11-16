(*---
description: A non-TRUE exit value is not a stop request, and no type is checked.
ref: tlc2/module/TLCGetSet.java#TLCSet
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE exit_non_boolean_ignored ----
EXTENDS TLC, Naturals
Test == TLCSet("exit", 1)
====

(*--- recorded
all:
  exit: 0
---*)
