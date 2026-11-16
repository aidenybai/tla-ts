(*---
description: Seq nests.
ref: tlc2/module/Sequences.java#member
features:
  - Sequences
flags:
  - expression
outcome: success
---*)
---- MODULE seq_nested ----
EXTENDS Sequences, Naturals
Test == <<<<1>>, <<>>>> \in Seq(Seq({1})) /\ <<<<2>>>> \notin Seq(Seq({1}))
====

(*--- recorded
all:
  exit: 0
---*)
