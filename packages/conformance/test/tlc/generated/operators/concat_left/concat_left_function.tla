(*---
description: concat_left applied to function, a FcnRcdValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_left_function ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([x \in {1, 2} |-> x * 2] \o <<9>>)
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2, 4, 9>>"
---*)
