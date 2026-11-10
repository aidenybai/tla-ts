(*---
description: or_right applied to function_lazy, a FcnLambdaValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_lor
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE or_right_function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(FALSE \/ [x \in Nat |-> x])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module or_right_function_lazy failed.
    Attempted to evaluate an expression of form P \/ Q when Q was
    a function of the form  [x \in S |-> expr].
    line 14, col 16 to line 14, col 41 of module or_right_function_lazy
---*)
