(*---
description: random_element applied to set_cap, a SetCapValue.
ref: tlc2/module/TLC.java#RandomElement
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_element_set_cap ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(RandomElement({1, 2} \cap {2, 3}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 2"
---*)
