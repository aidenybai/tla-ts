(*---
description: Asks whether int_zero is in set_cup, a SetCupValue.
ref: tlc2/value/impl/SetCupValue.java#member
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE in_set_cup__int_zero ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((0) \in ({1} \cup {2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
