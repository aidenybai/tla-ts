(*---
description: concat_right applied to function, a FcnRcdValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_right_function ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<9>> \o [x \in {1, 2} |-> x * 2])
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<9, 2, 4>>"
---*)
