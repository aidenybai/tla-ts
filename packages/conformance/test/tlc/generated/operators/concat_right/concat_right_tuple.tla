(*---
description: concat_right applied to tuple, a TupleValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_right_tuple ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<9>> \o <<1, 2>>)
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<9, 1, 2>>"
---*)
