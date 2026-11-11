(*---
description: exists_over applied to set_of_records, a SetOfRcdsValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_bf
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE exists_over_set_of_records ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(\E e \in [a : {1, 2}] : TRUE)
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
