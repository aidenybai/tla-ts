(*---
description: TLCGet("action") in BFS mode has the dummy name in every context.
ref: tlc2/module/TLCGetSet.java#TLCGetStringValue
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE action_unknown_all_contexts ----
EXTENDS TLC, Naturals
Test == TLCGet("action").name = "UnnamedAction"
====

(*--- recorded
all:
  exit: 0
---*)
