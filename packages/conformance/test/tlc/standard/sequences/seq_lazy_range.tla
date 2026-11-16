(*---
description: Seq does not evaluate membership in its range until needed, and a filter range works.
ref: tlc2/module/Sequences.java#member
features:
  - Sequences
flags:
  - expression
outcome: success
---*)
---- MODULE seq_lazy_range ----
EXTENDS Sequences, Naturals
Test == <<2>> \in Seq({n \in Nat : n > 1})
====

(*--- recorded
all:
  exit: 0
---*)
