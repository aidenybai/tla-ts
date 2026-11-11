(*---
description: PrintT prints nested Seq and named ranges.
ref: tlc2/module/Sequences.java#toString
features:
  - Sequences
flags:
  - expression
outcome: success
---*)
---- MODULE seq_nested_prints ----
EXTENDS Sequences, Naturals, TLC
Test == PrintT(Seq(Seq(Nat)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| Seq(Seq(Nat))"
---*)
