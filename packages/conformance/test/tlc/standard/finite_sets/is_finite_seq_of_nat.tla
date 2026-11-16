(*---
description: Seq(Nat) is infinite and does not trip over Nat.
ref: tlc2/module/Sequences.java#isFinite
features:
  - FiniteSets
flags:
  - expression
outcome: success
---*)
---- MODULE is_finite_seq_of_nat ----
EXTENDS FiniteSets, Sequences, Naturals
Test == ~IsFiniteSet(Seq(Nat))
====

(*--- recorded
all:
  exit: 0
---*)
