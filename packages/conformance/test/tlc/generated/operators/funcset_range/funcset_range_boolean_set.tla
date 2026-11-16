(*---
description: funcset_range applied to boolean_set, a SetEnumValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE funcset_range_boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([{9} -> BOOLEAN])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {(9 :> FALSE), (9 :> TRUE)}"
---*)
