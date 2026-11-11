(*---
description: Asks whether bag is in cross, a SetOfTuplesValue.
ref: tlc2/value/impl/SetOfTuplesValue.java#member
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE in_cross__bag ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SetToBag({1})) \in ({1, 2} \X {3}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
