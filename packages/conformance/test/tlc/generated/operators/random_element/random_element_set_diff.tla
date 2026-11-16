(*---
description: random_element applied to set_diff, a SetDiffValue.
ref: tlc2/module/TLC.java#RandomElement
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_element_set_diff ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(RandomElement({1, 2} \ {2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
