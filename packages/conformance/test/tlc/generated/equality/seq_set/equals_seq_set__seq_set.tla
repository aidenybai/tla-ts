(*---
description: Compares seq_set, a UserValue, with seq_set, a UserValue.
ref: tlc2/value/impl/UserValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_seq_set__seq_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Seq({1})) = (Seq({1})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
