(*---
description: and_right applied to function_lazy, a FcnLambdaValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_land
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE and_right_function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(TRUE /\ [x \in Nat |-> x])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module and_right_function_lazy failed.
    Attempted to evaluate an expression of form P /\ Q when Q was
    a function of the form  [x \in S |-> expr].
    line 14, col 16 to line 14, col 40 of module and_right_function_lazy
---*)
