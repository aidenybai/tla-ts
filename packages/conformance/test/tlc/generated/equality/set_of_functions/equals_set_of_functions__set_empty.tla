(*---
description: Compares set_of_functions, a SetOfFcnsValue, with set_empty, a SetEnumValue.
ref: tlc2/value/impl/SetOfFcnsValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_set_of_functions__set_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([{1} -> {2, 3}]) = ({}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
