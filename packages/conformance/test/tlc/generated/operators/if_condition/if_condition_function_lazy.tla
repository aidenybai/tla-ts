(*---
description: if_condition applied to function_lazy, a FcnLambdaValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_ite
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE if_condition_function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF [x \in Nat |-> x] THEN 1 ELSE 2)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module if_condition_function_lazy failed.
    A non-boolean expression (a function of the form  [x \in S |-> expr]) was used as the condition of an IF.
    line 14, col 16 to line 14, col 49 of module if_condition_function_lazy
---*)
