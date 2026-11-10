(*---
description: cap of seq_set, a UserValue, and set_of_functions, a SetOfFcnsValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_seq_set__set_of_functions ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Seq({1})) \cap ([{1} -> {2, 3}]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
