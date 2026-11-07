(*---
description: append of tuple, a TupleValue, and set_of_records, a SetOfRcdsValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_tuple__set_of_records ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<1, 2>>, [a : {1, 2}]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 2, {[a |-> 1], [a |-> 2]}>>"
---*)
