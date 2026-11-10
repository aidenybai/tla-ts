(*---
description: forall_over applied to function, a FcnRcdValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_be
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE forall_over_function ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(\A e \in [x \in {1, 2} |-> x * 2] : TRUE)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module forall_over_function failed.
    TLC encountered a non-enumerable quantifier bound
    <<2, 4>>.
    line 14, col 25 to line 14, col 48 of module forall_over_function
---*)
