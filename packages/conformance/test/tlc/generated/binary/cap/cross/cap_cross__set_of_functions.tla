(*---
description: cap of cross, a SetOfTuplesValue, and set_of_functions, a SetOfFcnsValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_cross__set_of_functions ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1, 2} \X {3}) \cap ([{1} -> {2, 3}]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
