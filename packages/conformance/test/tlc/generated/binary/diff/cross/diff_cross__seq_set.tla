(*---
description: diff of cross, a SetOfTuplesValue, and seq_set, a UserValue.
ref: tlc2/value/impl/SetDiffValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE diff_cross__seq_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1, 2} \X {3}) \ (Seq({1})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<1, 3>>, <<2, 3>>}"
---*)
