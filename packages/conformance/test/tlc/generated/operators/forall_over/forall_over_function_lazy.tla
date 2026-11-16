(*---
description: forall_over applied to function_lazy, a FcnLambdaValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_be
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE forall_over_function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(\A e \in [x \in Nat |-> x] : TRUE)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module forall_over_function_lazy failed.
    TLC encountered a non-enumerable quantifier bound
    [x \in Nat |-> <expression line 14, col 40 to line 14, col 40 of module forall_over_function_lazy>].
    line 14, col 25 to line 14, col 41 of module forall_over_function_lazy
---*)
