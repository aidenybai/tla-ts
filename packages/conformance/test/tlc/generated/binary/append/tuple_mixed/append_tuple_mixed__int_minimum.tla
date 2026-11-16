(*---
description: append of tuple_mixed, a TupleValue, and int_minimum, a IntValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_tuple_mixed__int_minimum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<1, "a", {TRUE}>>, (-2147483647 - 1)))
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<1, "a", {TRUE}, -2147483648>>'
---*)
