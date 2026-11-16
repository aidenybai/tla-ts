(*---
description: append of tuple_mixed, a TupleValue, and cross, a SetOfTuplesValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_tuple_mixed__cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<1, "a", {TRUE}>>, {1, 2} \X {3}))
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<1, "a", {TRUE}, {<<1, 3>>, <<2, 3>>}>>'
---*)
