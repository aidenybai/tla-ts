(*---
description: cross of set_of_functions, a SetOfFcnsValue, and set_ints, a SetEnumValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_set_of_functions__set_ints ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([{1} -> {2, 3}]) \X ({2, 1}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<<<2>>, 1>>, <<<<2>>, 2>>, <<<<3>>, 1>>, <<<<3>>, 2>>}"
---*)
