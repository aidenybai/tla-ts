(*---
description: concat_right applied to function_empty, a FcnRcdValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_right_function_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<9>> \o [x \in {} |-> x])
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<9>>"
---*)
