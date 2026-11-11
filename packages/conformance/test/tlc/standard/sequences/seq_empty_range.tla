(*---
description: Only <<>> is in Seq({}).
ref: tlc2/module/Sequences.java#member
features:
  - Sequences
flags:
  - expression
outcome: success
---*)
---- MODULE seq_empty_range ----
EXTENDS Sequences, Naturals
Test == <<>> \in Seq({}) /\ <<1>> \notin Seq({})
====

(*--- recorded
all:
  exit: 0
---*)
