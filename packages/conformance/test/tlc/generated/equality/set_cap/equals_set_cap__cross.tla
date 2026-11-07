(*---
description: Compares set_cap, a SetCapValue, with cross, a SetOfTuplesValue.
ref: tlc2/value/impl/SetCapValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_set_cap__cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1, 2} \cap {2, 3}) = ({1, 2} \X {3}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
