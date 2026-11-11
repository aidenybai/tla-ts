(*---
description: Asks whether colon_greater is in cross, a SetOfTuplesValue.
ref: tlc2/value/impl/SetOfTuplesValue.java#member
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE in_cross__colon_greater ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1 :> 2) \in ({1, 2} \X {3}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
