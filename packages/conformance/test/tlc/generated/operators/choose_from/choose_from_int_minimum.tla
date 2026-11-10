(*---
description: choose_from applied to int_minimum, a IntValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_bc
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE choose_from_int_minimum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CHOOSE e \in (-2147483647 - 1) : TRUE)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module choose_from_int_minimum failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 16 to line 14, col 52 of module choose_from_int_minimum
---*)
