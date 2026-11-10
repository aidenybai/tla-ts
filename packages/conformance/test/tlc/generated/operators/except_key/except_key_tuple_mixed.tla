(*---
description: except_key applied to tuple_mixed, a TupleValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_exc
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE except_key_tuple_mixed ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([<<1, 2>> EXCEPT ![<<1, "a", {TRUE}>>] = 9])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module except_key_tuple_mixed failed.
    Attempted to access tuple at a non integral index: <<1, "a", {TRUE}>>
---*)
