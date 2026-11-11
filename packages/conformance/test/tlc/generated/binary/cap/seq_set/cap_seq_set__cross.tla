(*---
description: cap of seq_set, a UserValue, and cross, a SetOfTuplesValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_seq_set__cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Seq({1})) \cap ({1, 2} \X {3}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
