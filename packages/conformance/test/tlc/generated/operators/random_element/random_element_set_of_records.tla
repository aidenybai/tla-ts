(*---
description: random_element applied to set_of_records, a SetOfRcdsValue.
ref: tlc2/module/TLC.java#RandomElement
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_element_set_of_records ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(RandomElement([a : {1, 2}]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 2]"
---*)
