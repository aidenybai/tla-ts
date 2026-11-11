(*---
description: exists_over applied to int_minimum, a IntValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_bf
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE exists_over_int_minimum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(\E e \in (-2147483647 - 1) : TRUE)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module exists_over_int_minimum failed.
    TLC encountered a non-enumerable quantifier bound
    -2147483648.
    line 14, col 26 to line 14, col 40 of module exists_over_int_minimum
---*)
