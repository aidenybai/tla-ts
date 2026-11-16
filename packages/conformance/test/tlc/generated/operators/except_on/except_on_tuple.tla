(*---
description: except_on applied to tuple, a TupleValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_exc
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE except_on_tuple ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([<<1, 2>> EXCEPT ![1] = 9])
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<9, 2>>"
---*)
