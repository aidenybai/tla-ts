(*---
description: Asks whether record is in set_of_records, a SetOfRcdsValue.
ref: tlc2/value/impl/SetOfRcdsValue.java#member
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE in_set_of_records__record ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> 1, b |-> 2]) \in ([a : {1, 2}]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
