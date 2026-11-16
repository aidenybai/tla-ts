(*---
description: append of tuple_mixed, a TupleValue, and colon_greater, a FcnRcdValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_tuple_mixed__colon_greater ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<1, "a", {TRUE}>>, 1 :> 2))
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<1, "a", {TRUE}, <<2>>>>'
---*)
