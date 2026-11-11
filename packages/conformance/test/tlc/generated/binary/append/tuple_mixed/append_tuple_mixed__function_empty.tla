(*---
description: append of tuple_mixed, a TupleValue, and function_empty, a FcnRcdValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_tuple_mixed__function_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<1, "a", {TRUE}>>, [x \in {} |-> x]))
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<1, "a", {TRUE}, <<>>>>'
---*)
