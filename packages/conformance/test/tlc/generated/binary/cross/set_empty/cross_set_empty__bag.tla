(*---
description: cross of set_empty, a SetEnumValue, and bag, a FcnRcdValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_set_empty__bag ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) \X (SetToBag({1})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
