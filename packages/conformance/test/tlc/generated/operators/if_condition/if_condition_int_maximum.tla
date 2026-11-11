(*---
description: if_condition applied to int_maximum, a IntValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_ite
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE if_condition_int_maximum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF 2147483647 THEN 1 ELSE 2)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module if_condition_int_maximum failed.
    A non-boolean expression (an integer) was used as the condition of an IF.
    line 14, col 16 to line 14, col 42 of module if_condition_int_maximum
---*)
