(*---
description: if_condition applied to tuple_mixed, a TupleValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_ite
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE if_condition_tuple_mixed ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF <<1, "a", {TRUE}>> THEN 1 ELSE 2)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module if_condition_tuple_mixed failed.
    A non-boolean expression (a tuple) was used as the condition of an IF.
    line 14, col 16 to line 14, col 50 of module if_condition_tuple_mixed
---*)
