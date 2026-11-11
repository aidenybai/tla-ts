(*---
description: subseteq of function_lazy, a FcnLambdaValue, and interval_empty, a IntervalValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_subseteq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseteq_function_lazy__interval_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in Nat |-> x]) \subseteq (3..1))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module subseteq_function_lazy__interval_empty failed.
    Attempted to evaluate an expression of form S \subseteq T, but S was not enumerable.
    line 14, col 16 to line 14, col 51 of module subseteq_function_lazy__interval_empty
---*)
