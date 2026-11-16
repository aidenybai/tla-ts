(*---
description: exists_over applied to boolean_set, a SetEnumValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_bf
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE exists_over_boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(\E e \in BOOLEAN : TRUE)
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
