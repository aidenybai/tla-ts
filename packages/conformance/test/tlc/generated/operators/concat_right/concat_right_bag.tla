(*---
description: concat_right applied to bag, a FcnRcdValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_right_bag ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<9>> \o SetToBag({1}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<9, 1>>"
---*)
