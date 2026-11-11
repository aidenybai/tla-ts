(*---
description: is_finite_set applied to record, a RecordValue.
ref: tlc2/module/FiniteSets.java#IsFiniteSet
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE is_finite_set_record ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IsFiniteSet([a |-> 1, b |-> 2]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
