(*---
description: forall_over applied to true, a BoolValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_be
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE forall_over_true ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(\A e \in TRUE : TRUE)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module forall_over_true failed.
    TLC encountered a non-enumerable quantifier bound
    TRUE.
    line 14, col 25 to line 14, col 28 of module forall_over_true
---*)
