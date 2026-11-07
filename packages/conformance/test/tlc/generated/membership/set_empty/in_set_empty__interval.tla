(*---
description: Asks whether interval is in set_empty, a SetEnumValue.
ref: tlc2/value/impl/SetEnumValue.java#member
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE in_set_empty__interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1..3) \in ({}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
