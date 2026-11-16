(*---
description: cross of set_of_functions, a SetOfFcnsValue, and boolean_set, a SetEnumValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_set_of_functions__boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([{1} -> {2, 3}]) \X (BOOLEAN))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<<<2>>, FALSE>>, <<<<2>>, TRUE>>, <<<<3>>, FALSE>>, <<<<3>>, TRUE>>}"
---*)
