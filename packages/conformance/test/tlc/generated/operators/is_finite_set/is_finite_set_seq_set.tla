(*---
description: is_finite_set applied to seq_set, a UserValue.
ref: tlc2/module/FiniteSets.java#IsFiniteSet
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE is_finite_set_seq_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IsFiniteSet(Seq({1})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
