(*---
description: append of tuple_empty, a TupleValue, and set_cup, a SetCupValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_tuple_empty__set_cup ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<>>, {1} \cup {2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<{1, 2}>>"
---*)
