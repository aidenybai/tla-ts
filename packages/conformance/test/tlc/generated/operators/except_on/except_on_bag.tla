(*---
description: except_on applied to bag, a FcnRcdValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_exc
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE except_on_bag ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SetToBag({1}) EXCEPT ![1] = 9])
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<9>>"
---*)
