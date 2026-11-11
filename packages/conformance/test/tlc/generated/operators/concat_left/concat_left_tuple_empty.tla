(*---
description: concat_left applied to tuple_empty, a TupleValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_left_tuple_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<>> \o <<9>>)
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<9>>"
---*)
