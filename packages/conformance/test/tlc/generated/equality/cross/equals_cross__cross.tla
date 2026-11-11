(*---
description: Compares cross, a SetOfTuplesValue, with cross, a SetOfTuplesValue.
ref: tlc2/value/impl/SetOfTuplesValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_cross__cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1, 2} \X {3}) = ({1, 2} \X {3}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
