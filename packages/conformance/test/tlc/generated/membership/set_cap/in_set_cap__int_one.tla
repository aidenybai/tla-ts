(*---
description: Asks whether int_one is in set_cap, a SetCapValue.
ref: tlc2/value/impl/SetCapValue.java#member
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE in_set_cap__int_one ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1) \in ({1, 2} \cap {2, 3}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
