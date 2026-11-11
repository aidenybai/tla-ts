(*---
description: subseteq of boolean_set, a SetEnumValue, and function_lazy, a FcnLambdaValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_subseteq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseteq_boolean_set__function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((BOOLEAN) \subseteq ([x \in Nat |-> x]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module subseteq_boolean_set__function_lazy failed.
    Attempted to check if the value:
    FALSE
    is an element of the function [x \in Nat |-> <expression line 14, col 52 to line 14, col 52 of module subseteq_boolean_set__function_lazy>]
---*)
