(*---
description: diff of set_of_functions, a SetOfFcnsValue, and cross, a SetOfTuplesValue.
ref: tlc2/value/impl/SetDiffValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE diff_set_of_functions__cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([{1} -> {2, 3}]) \ ({1, 2} \X {3}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<2>>, <<3>>}"
---*)
