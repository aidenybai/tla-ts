(*---
description: Seq(S) of a non-empty S is infinite.
ref: tlc2/module/Sequences.java#isFinite
features:
  - FiniteSets
flags:
  - expression
outcome: success
---*)
---- MODULE is_finite_seq_of_nonempty ----
EXTENDS FiniteSets, Sequences
Test == ~IsFiniteSet(Seq({1}))
====

(*--- recorded
all:
  exit: 0
---*)
