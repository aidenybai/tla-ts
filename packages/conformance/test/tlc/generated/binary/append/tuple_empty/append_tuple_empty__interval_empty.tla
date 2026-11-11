(*---
description: append of tuple_empty, a TupleValue, and interval_empty, a IntervalValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_tuple_empty__interval_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<>>, 3..1))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<{}>>"
---*)
