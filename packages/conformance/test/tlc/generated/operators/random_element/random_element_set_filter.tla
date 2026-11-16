(*---
description: random_element applied to set_filter, a SetPredValue.
ref: tlc2/module/TLC.java#RandomElement
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_element_set_filter ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(RandomElement({x \in 1..3 : x > 1}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 3"
---*)
