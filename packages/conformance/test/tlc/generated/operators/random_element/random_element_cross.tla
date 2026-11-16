(*---
description: random_element applied to cross, a SetOfTuplesValue.
ref: tlc2/module/TLC.java#RandomElement
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_element_cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(RandomElement({1, 2} \X {3}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2, 3>>"
---*)
