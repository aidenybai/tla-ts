(*---
description: append of tuple_mixed, a TupleValue, and set_filter, a SetPredValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_tuple_mixed__set_filter ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<1, "a", {TRUE}>>, {x \in 1..3 : x > 1}))
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<1, "a", {TRUE}, {2, 3}>>'
---*)
