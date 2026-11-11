(*---
description: "In ASSUME the checker exists already, so the counters answer: nothing yet distinct, generated or queued, and a diameter of 1."
ref: tlc2/module/TLCGetSet.java#TLCGetStringValue
features:
  - TLC
flags:
  - expression
contexts:
  - assume
outcome: success
---*)
---- MODULE assume_counters ----
EXTENDS TLC, Naturals
Test == TLCGet("distinct") = 0 /\ TLCGet("generated") = 0 /\ TLCGet("queue") = 0 /\ TLCGet("diameter") = 1
====

(*--- recorded
all:
  exit: 0
---*)
