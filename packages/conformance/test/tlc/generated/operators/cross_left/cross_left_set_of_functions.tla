(*---
description: cross_left applied to set_of_functions, a SetOfFcnsValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_left_set_of_functions ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([{1} -> {2, 3}] \X {9})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<<<2>>, 9>>, <<<<3>>, 9>>}"
---*)
