(*---
description: cap of set_of_functions, a SetOfFcnsValue, and seq_set, a UserValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_set_of_functions__seq_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([{1} -> {2, 3}]) \cap (Seq({1})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
