(*---
description: cap of set_empty, a SetEnumValue, and cross, a SetOfTuplesValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_set_empty__cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) \cap ({1, 2} \X {3}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
