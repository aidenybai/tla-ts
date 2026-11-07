(*---
description: Asks whether bag is in seq_set, a UserValue.
ref: tlc2/value/impl/UserValue.java#member
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE in_seq_set__bag ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SetToBag({1})) \in (Seq({1})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
