(*---
description: append_to applied to tuple_mixed, a TupleValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_to_tuple_mixed ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<1, "a", {TRUE}>>, 9))
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<1, "a", {TRUE}, 9>>'
---*)
