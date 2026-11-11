(*---
description: random_element applied to set_map, a SetEnumValue.
ref: tlc2/module/TLC.java#RandomElement
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_element_set_map ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(RandomElement({x + 1 : x \in 1..2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 3"
---*)
