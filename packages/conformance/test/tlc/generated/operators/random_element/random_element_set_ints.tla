(*---
description: random_element applied to set_ints, a SetEnumValue.
ref: tlc2/module/TLC.java#RandomElement
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_element_set_ints ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(RandomElement({2, 1}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 2"
---*)
