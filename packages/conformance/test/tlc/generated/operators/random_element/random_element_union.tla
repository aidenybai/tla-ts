(*---
description: random_element applied to union, a UnionValue.
ref: tlc2/module/TLC.java#RandomElement
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_element_union ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(RandomElement(UNION {{1}, {2}}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 2"
---*)
