(*---
description: cross of set_of_functions, a SetOfFcnsValue, and set_empty, a SetEnumValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_set_of_functions__set_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([{1} -> {2, 3}]) \X ({}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
