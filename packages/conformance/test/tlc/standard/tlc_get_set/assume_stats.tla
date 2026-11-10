(*---
description: TLCGet("stats") answers in ASSUME, on the main thread as worker 0.
ref: tlc2/module/TLCGetSet.java#TLCGetStringValue
features:
  - TLC
flags:
  - expression
contexts:
  - assume
outcome: success
---*)
---- MODULE assume_stats ----
EXTENDS TLC, Naturals
Test == TLCGet("stats").distinct = 0 /\ TLCGet("stats").worker = 0
====

(*--- recorded
all:
  exit: 0
---*)
