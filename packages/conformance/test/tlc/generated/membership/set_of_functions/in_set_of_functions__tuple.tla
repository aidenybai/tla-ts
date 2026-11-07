(*---
description: Asks whether tuple is in set_of_functions, a SetOfFcnsValue.
ref: tlc2/value/impl/SetOfFcnsValue.java#member
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE in_set_of_functions__tuple ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<1, 2>>) \in ([{1} -> {2, 3}]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
