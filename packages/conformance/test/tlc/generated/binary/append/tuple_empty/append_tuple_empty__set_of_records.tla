(*---
description: append of tuple_empty, a TupleValue, and set_of_records, a SetOfRcdsValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_tuple_empty__set_of_records ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<>>, [a : {1, 2}]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<{[a |-> 1], [a |-> 2]}>>"
---*)
