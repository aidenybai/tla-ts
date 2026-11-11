(*---
description: append of tuple, a TupleValue, and tuple_mixed, a TupleValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_tuple__tuple_mixed ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<1, 2>>, <<1, "a", {TRUE}>>))
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<1, 2, <<1, "a", {TRUE}>>>>'
---*)
