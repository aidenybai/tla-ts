(*---
description: concat_left applied to tuple, a TupleValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_left_tuple ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<1, 2>> \o <<9>>)
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 2, 9>>"
---*)
