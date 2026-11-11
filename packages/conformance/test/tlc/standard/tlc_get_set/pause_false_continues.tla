(*---
description: TLCSet("pause", FALSE) returns TRUE without prompting.
ref: tlc2/module/TLCGetSet.java#TLCSet
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE pause_false_continues ----
EXTENDS TLC, Naturals
Test == TLCSet("pause", FALSE)
====

(*--- recorded
all:
  exit: 0
---*)
