(*---
description: append of tuple_empty, a TupleValue, and record, a RecordValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_tuple_empty__record ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<>>, [a |-> 1, b |-> 2]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<[a |-> 1, b |-> 2]>>"
---*)
