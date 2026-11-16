(*---
description: map_over applied to int_minimum, a IntValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_sso
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE map_over_int_minimum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({e : e \in (-2147483647 - 1)})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module map_over_int_minimum failed.
    TLC encountered a non-enumerable quantifier bound
    -2147483648.
    line 14, col 28 to line 14, col 42 of module map_over_int_minimum
---*)
