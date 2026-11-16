(*---
description: append of tuple_empty, a TupleValue, and set_cap, a SetCapValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_tuple_empty__set_cap ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<>>, {1, 2} \cap {2, 3}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<{2}>>"
---*)
