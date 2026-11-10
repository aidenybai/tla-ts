(*---
description: PrintT prints Seq with its range.
ref: tlc2/module/Sequences.java#toString
features:
  - Sequences
flags:
  - expression
outcome: success
---*)
---- MODULE seq_prints ----
EXTENDS Sequences, Naturals, TLC
Test == PrintT(Seq({2, 1}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| Seq({1, 2})"
---*)
