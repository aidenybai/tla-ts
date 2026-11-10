(*---
description: subseteq of cross, a SetOfTuplesValue, and function_lazy, a FcnLambdaValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_subseteq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseteq_cross__function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1, 2} \X {3}) \subseteq ([x \in Nat |-> x]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module subseteq_cross__function_lazy failed.
    Attempted to check if the value:
    <<1, 3>>
    is an element of the function [x \in Nat |-> <expression line 14, col 58 to line 14, col 58 of module subseteq_cross__function_lazy>]
---*)
