(*---
description: except_on applied to tuple_mixed, a TupleValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_exc
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE except_on_tuple_mixed ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([<<1, "a", {TRUE}>> EXCEPT ![1] = 9])
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<9, "a", {TRUE}>>'
---*)
