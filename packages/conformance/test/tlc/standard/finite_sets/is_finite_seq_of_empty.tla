(*---
description: Seq({}) counts as finite, since it has only <<>>.
ref: tlc2/module/Sequences.java#isFinite
features:
  - FiniteSets
flags:
  - expression
outcome: success
---*)
---- MODULE is_finite_seq_of_empty ----
EXTENDS FiniteSets, Sequences
Test == IsFiniteSet(Seq({}))
====

(*--- recorded
all:
  exit: 0
---*)
